# backend/payroll/payroll_calculator.py
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Dict, Iterable, List, Optional

from django.db import transaction

from employee.models import Employee, MonthlyAttendanceSummary
from loan.models import Loan
from payroll.models import IncentiveRule, PayrollSettings
from .payroll_fetchers import (
    get_attendance_map,
    get_payroll_loans,
    get_sorted_payroll_employees,
)


@dataclass
class AttendanceStats:
    working_days: int
    paid_leave_days: int
    unpaid_leave_days: int
    present_days: int
    payable_days: int  # <-- add this


@dataclass
class PayrollComputation:
    employee: Employee
    base_pay: Decimal
    incentive_pay: Decimal
    gross_pay: Decimal
    statutory_deductions: Decimal
    net_pay: Decimal
    loans_count: int
    notes: str = ""


class PayrollCalculator:
    def __init__(self, period_start: date, period_end: date):
        self.period_start = period_start
        self.period_end = period_end
        self.settings = PayrollSettings.get_solo()

    def run(self) -> List[PayrollComputation]:
        employees = list(get_sorted_payroll_employees())
        attendance_map = get_attendance_map(self.period_start, self.period_end)
        loans = list(get_payroll_loans(self.period_start, self.period_end))
        loans_by_employee = self._index_loans_dynamic(loans)
        incentive_rules = IncentiveRule.objects.filter(is_active=True).select_related("milestone").prefetch_related("roles")

        computations: List[PayrollComputation] = []
        for employee in employees:
            summary = attendance_map.get(employee.id)
            attendance_stats = self._build_attendance_stats(summary)
            employee_loans = loans_by_employee.get(employee.id, [])
            incentive_amount = self._calculate_incentive(employee, employee_loans, incentive_rules)
            base_pay = self._calculate_base_salary(employee, attendance_stats)

            # --- Add other earnings here ---
            bonus = getattr(employee, "bonus_amount", Decimal("0.00"))
            leave_encash = getattr(employee, "leave_encashment_amount", Decimal("0.00"))
            overtime = getattr(employee, "overtime_amount", Decimal("0.00"))
            night_shift = getattr(employee, "night_shift_allowance", Decimal("0.00"))
            arrear = getattr(employee, "arrear_salary", Decimal("0.00"))
            special = getattr(employee, "special_allowance", Decimal("0.00"))
            food = getattr(employee, "food_allowance", Decimal("0.00"))
            uniform = getattr(employee, "uniform_allowance", Decimal("0.00"))
            medical = getattr(employee, "medical_reimbursement", Decimal("0.00"))
            conveyance = getattr(employee, "conveyance_allowance", Decimal("0.00"))
            other_allowances = getattr(employee, "other_allowances", Decimal("0.00"))

            gross = (
            base_pay + incentive_amount + bonus + leave_encash + overtime +
            night_shift + arrear + special + food + uniform + medical +
            conveyance + other_allowances
             ).quantize(Decimal("0.01"))
            
            settings = self.settings
            pf_employee = (base_pay * settings.pf_employee_rate).quantize(Decimal("0.01"))
            esi_employee = (gross * settings.esi_employee_rate).quantize(Decimal("0.01"))

            deductions = pf_employee + esi_employee  # add other deductions as needed
            net = (gross - deductions).quantize(Decimal("0.01"))

            
            computations.append(
            PayrollComputation(
                employee=employee,
                base_pay=base_pay,
                incentive_pay=incentive_amount,
                gross_pay=gross,
                statutory_deductions=deductions,
                net_pay=net,
                loans_count=len(employee_loans),
                #notes="",
                # Optionally, add pf_employee and esi_employee as fields if you extend PayrollComputation
            )
        )
        return computations

    @staticmethod
    def _index_loans_dynamic(loans: Iterable[Loan]) -> Dict[int, List[Loan]]:
        """
        For each loan, for each employee in its role assignments, attach loan to employee.
        """
        mapped: Dict[int, List[Loan]] = {}
        for loan in loans:
            # loan.role_assignments is a RelatedManager; call .all() to iterate
            role_assignments_qs = None
            try:
                role_assignments_qs = loan.role_assignments.all()
            except Exception:
                # If attribute missing or not a manager, fallback to empty list
                role_assignments_qs = []

            for ra in role_assignments_qs:
                # employees is M2M; ensure we iterate queryset
                for emp in ra.employees.all():
                    bucket = mapped.setdefault(emp.id, [])
                    # avoid duplicate entries if multiple RA objects map same loan-emp
                    if not bucket or bucket[-1] is not loan:
                        # last-element check is O(1) and sufficient because duplicates
                        # typically arise from repeated prefetches; if needed, convert to set
                        bucket.append(loan)
        return mapped

    def save_computations(self, computations: List[PayrollComputation], status: str = "draft"):
        from payroll.models import EmployeePayroll
        with transaction.atomic():
            created_objs = []
            for c in computations:
                settings = self.settings
                pf_employee = (c.base_pay * settings.pf_employee_rate).quantize(Decimal("0.01"))
                esi_employee = (c.gross_pay * settings.esi_employee_rate).quantize(Decimal("0.01"))
                obj, _ = EmployeePayroll.objects.get_or_create(
                employee=c.employee,
                month=self.period_start,   # first day of month

                # obj, _ = EmployeePayroll.objects.get_or_create(
                # employee=c.employee,
                # month=self.period_start,   # first day of month
                defaults={
                        "base_salary": c.base_pay,
                        "hra": Decimal("0.00"),
                        "other_allowances": Decimal("0.00"),
                        "working_days": self.settings.standard_working_days,
                        "present_days": 0,
                        "paid_leave_days": 0,
                        "unpaid_leave_days": 0,
                        "payable_days": 0,
                        "prorated_base": c.base_pay,
                        "loan_count": c.loans_count,
                        "incentive_amount": c.incentive_pay,
                        "incentive_breakdown": {},
                        "gross_salary": c.gross_pay,
                        "pf_employee_contribution": pf_employee,
                        "esi_employee_contribution": esi_employee,
                        "eps_contribution": Decimal("0.00"),
                        "esi_employee_contribution": Decimal("0.00"),
                        "esi_employer_contribution": Decimal("0.00"),
                        "other_deductions": Decimal("0.00"),
                        "total_deductions": c.statutory_deductions,
                        "net_salary": c.net_pay,
                        "status": status,
                    },
                )
                created_objs.append(obj)
            return created_objs

    def _build_attendance_stats(self, summary: Optional[dict]) -> AttendanceStats:
        if not summary:
            wd = int(getattr(self.settings, "standard_working_days", 26) or 26)
            return AttendanceStats(
                working_days=wd,
                paid_leave_days=0,
                unpaid_leave_days=0,
                present_days=wd,
                payable_days=wd,  # all days are payable if no data
            )
        present = summary.get("present", 0)
        paid_leave = summary.get("paid_leave", 0)
        unpaid_leave = summary.get("unpaid_leave", 0)
        working_days = present + paid_leave + unpaid_leave
        payable_days = present + paid_leave
        return AttendanceStats(
            working_days=working_days,
            paid_leave_days=paid_leave,
            unpaid_leave_days=unpaid_leave,
            present_days=present,
            payable_days=payable_days,
        )
    def _calculate_base_salary(self, employee: Employee, stats: AttendanceStats) -> Decimal:
        if stats.working_days <= 0:
            return Decimal("0.00")
        return employee.prorated_salary(stats.payable_days, stats.working_days)

    def _calculate_incentive(
        self,
        employee: Employee,
        employee_loans: Iterable[Loan],
        incentive_rules: Iterable[IncentiveRule],
    ) -> Decimal:
        total = Decimal("0.00")
        # Work with a materialized list so we can count multiple times
        loans_list = list(employee_loans)
        for rule in incentive_rules:
            # Determine eligible loans for this rule: milestone + role-matched assignments
            role_ids = set(rule.roles.values_list("id", flat=True))
            count = 0
            for ln in loans_list:
                # Milestone filter
                if rule.milestone_id and getattr(ln, "milestone_id", None) != rule.milestone_id:
                    continue
                # Role+assignment filter: if rule has specific roles, ensure employee is assigned on ln with one of those roles
                if role_ids:
                    try:
                        ras = ln.role_assignments.all()
                    except Exception:
                        ras = []
                    matched = False
                    for ra in ras:
                        if ra.role_id in role_ids:
                            # employees is M2M; cheap id check
                            if any(getattr(emp, "id", None) == employee.id for emp in ra.employees.all()):
                                matched = True
                                break
                    if not matched:
                        continue
                count += 1
            if count <= 0:
                continue
            total += rule.calculate_amount(count)
        return total.quantize(Decimal("0.01"))

    def _calculate_statutory_deductions(
        self,
        employee: Employee,
        base_pay: Decimal,
        incentive_amount: Decimal,
    ) -> Decimal:
        gross = base_pay + incentive_amount
        settings = self.settings
        pf = (base_pay * settings.pf_employee_rate).quantize(Decimal("0.01"))
        esi = (gross * settings.esi_employee_rate).quantize(Decimal("0.01"))
        return pf + esi

    @staticmethod
    def _index_loans(loans: Iterable[Loan]) -> Dict[int, List[Loan]]:
        mapped: Dict[int, List[Loan]] = {}
        for loan in loans:
            if loan.assigned_to_id is None:
                continue
            mapped.setdefault(loan.assigned_to_id, []).append(loan)
        return mapped
