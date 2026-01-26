# backend/payroll/payroll_fetchers.py
from datetime import date
from typing import Dict, Iterable

from django.db.models import OuterRef, Subquery, IntegerField, F, Prefetch

from employee.models import Employee, Attendance
from loan.models import Loan, LoanRoleAssignment
from userauth.models import RoleMetadata


def get_sorted_payroll_employees() -> Iterable[Employee]:
    """
    Employees ordered by role priority, then name
    """
    metadata_subquery = (
        RoleMetadata.objects.filter(group__employee__pk=OuterRef("pk"))
        .order_by("sort_order")
        .values("sort_order")[:1]
    )

    return (
        Employee.objects.filter(is_archived=False)
        .annotate(
            primary_role_sort_order=Subquery(
                metadata_subquery, output_field=IntegerField()
            )
        )
        .order_by(F("primary_role_sort_order").asc(nulls_last=True), "name")
        .prefetch_related("roles__metadata")
    )


def get_payroll_loans(period_start: date, period_end: date):
    """
    Loans created in payroll period
    """
    return (
        Loan.objects.filter(
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
            is_archived=False,
        )
        .select_related("broker", "loan_officer")
        .prefetch_related(
            Prefetch(
                "role_assignments",
                queryset=LoanRoleAssignment.objects
                .select_related("role")
                .prefetch_related("employees"),
            )
        )
    )


from datetime import date
from typing import Dict
from employee.models import Attendance


def get_attendance_map(period_start: date, period_end: date) -> Dict[int, dict]:
    qs = Attendance.objects.filter(
        date__gte=period_start,
        date__lte=period_end,
    )

    data: Dict[int, dict] = {}

    for a in qs:
        emp = a.employee_id
        data.setdefault(emp, {"present": 0, "paid_leave": 0, "unpaid_leave": 0})

        if a.status in (
            Attendance.STATUS_PRESENT,
            Attendance.STATUS_LATE,
            Attendance.STATUS_EARLY,
        ):
            data[emp]["present"] += 1
        elif a.status == Attendance.STATUS_ON_LEAVE:
            data[emp]["paid_leave"] += 1
        elif a.status == Attendance.STATUS_UNPAID_LEAVE:
            data[emp]["unpaid_leave"] += 1

    return data
