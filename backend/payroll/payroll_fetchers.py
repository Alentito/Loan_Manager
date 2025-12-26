# backend/payroll/payroll_fetchers.py
from datetime import date
from typing import Dict, Iterable, Tuple

from django.db.models import OuterRef, Subquery, IntegerField, Value, F, Q, Prefetch
from django.utils import timezone

from employee.models import Employee, MonthlyAttendanceSummary
from loan.models import Loan, Milestone
from userauth.models import RoleMetadata
from loan.models import Loan, Milestone, LoanRoleAssignment


def get_sorted_payroll_employees() -> Iterable[Employee]:
    """
    Return employees flagged for payroll, ordered by their lowest role sort_order then name.
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
            ),
        )
        .order_by(F("primary_role_sort_order").asc(nulls_last=True), "name")
        .prefetch_related("roles__metadata")
    )


def get_payroll_loans(period_start: date, period_end: date) -> Iterable[Loan]:
    return (
        Loan.objects.filter(
            created_at__date__gte=period_start,
            created_at__date__lte=period_end,
            is_archived=False,
        )
        # REMOVE .only(); it caused deferred FK + select_related conflict
        .select_related("broker", "loan_officer")
        .prefetch_related(
            Prefetch(
                "role_assignments",
                queryset=LoanRoleAssignment.objects
                    .select_related("role")
                    .prefetch_related("employees")
            )
        )
    )


def get_attendance_map(period_start: date, period_end: date) -> Dict[int, MonthlyAttendanceSummary]:
    """
    Return monthly attendance summary keyed by employee id for the given period.
    """
    year = period_start.year
    month = period_start.month
    summaries = MonthlyAttendanceSummary.objects.filter(
        year=year,
        month=month,
    ).select_related("employee")
    return {summary.employee_id: summary for summary in summaries}
