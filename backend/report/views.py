# backend/report/views.py
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q, Exists, OuterRef, Prefetch 
from loan.models import Loan, LoanRoleAssignment, Task
from employee.models import Employee
from employee.utils import to_cst
import logging

logger = logging.getLogger(__name__)


# -----------------------------
# Pagination
# -----------------------------
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 10000


# -----------------------------
# FUNDING / MILESTONE REPORT
# -----------------------------
class FundedLoanReportAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        qs = Loan.objects.all().select_related("broker", "loan_officer", "milestone")

        # Visibility for non-admin users
        if not user.is_superuser and not user.has_perm("loan.view_all_loans"):
            try:
                employee = Employee.objects.get(user=user)
            except Employee.DoesNotExist:
                employee = None

            visibility_q = Q()
            if employee:
                visibility_q |= Q(role_assignments__employees=employee)
            if hasattr(Loan, "created_by"):
                visibility_q |= Q(created_by=user)

            assigner_exists = Task.objects.filter(loan_id=OuterRef("pk"), assigner_id=user.id)
            assignee_exists = Task.objects.filter(loan_id=OuterRef("pk"), assignee_id=employee.id) if employee else Task.objects.none()

            qs = qs.annotate(
                is_assigner=Exists(assigner_exists),
                is_assignee=Exists(assignee_exists)
            ).filter(
                visibility_q | Q(is_assigner=True) | Q(is_assignee=True)
            )

        # Exclude archived
        if self.request.query_params.get("include_archived", "").lower() != "true":
            qs = qs.filter(is_archived=False)

        # Filters
        broker_id = self.request.query_params.get("broker")
        officer_id = self.request.query_params.get("loan_officer")
        lead_id = self.request.query_params.get("team_leader")
        processor_id = self.request.query_params.get("processor")
        milestone_id = self.request.query_params.get("milestone")
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")

        if broker_id:
            qs = qs.filter(broker_id=broker_id)
        if officer_id:
            qs = qs.filter(loan_officer_id=officer_id)
        if lead_id:
            qs = qs.filter(
                role_assignments__role__name__iexact='lead',
                role_assignments__employees__id=lead_id
            )

        if processor_id:
            qs = qs.filter(
                role_assignments__role__name__iexact='processor',
                role_assignments__employees__id=processor_id
            )

        if milestone_id:
            qs = qs.filter(milestone_id=milestone_id)
        if start_date:
            qs = qs.filter(created_at__date__gte=start_date)

        if end_date:
            qs = qs.filter(created_at__date__lte=end_date)
            
        # Prefetch role assignments for efficient access
        qs = qs.prefetch_related(
            Prefetch(
                'role_assignments',
                queryset=LoanRoleAssignment.objects.select_related('role').prefetch_related('employees')
            )
        )

        return qs.distinct()
 # avoid duplicates from multiple role_assignments



    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        if not queryset.exists():
            return Response({
                "results": [],
                "message": "No data found for selected filters."
            }, status=200)

        milestone_counts = (
            queryset
            .filter(
                milestone__isnull=False,
                milestone__include_in_reports=True,   # ✅ USE EXISTING FIELD
                milestone__status="active",           # ✅ OPTIONAL but recommended
            )
            .values(
                "milestone__id",
                "milestone__name",
                "milestone__sort_order",
                "milestone__color",
                "milestone__background_color",
            )
            .annotate(count=Count("id"))
            .order_by("milestone__sort_order")
        )

        results = [
            {
                "milestone_id": row["milestone__id"],
                "milestone": row["milestone__name"],
                "count": row["count"],
            }
            for row in milestone_counts
        ]

        total_loans = sum(row["count"] for row in results)

        return Response({
            "results": results,
            
            "total_loans": total_loans,
        })


# -----------------------------
# LINKED EMPLOYEES BY BROKER
# -----------------------------
class BrokerLinkedEmployeesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        broker_id = request.query_params.get("broker")
        if not broker_id:
            return Response({
                "loan_officers": [],
                "team_leaders": [],
                "processors": []
            })

        loans = Loan.objects.filter(broker_id=broker_id).prefetch_related(
            Prefetch(
                "role_assignments",
                queryset=LoanRoleAssignment.objects.select_related("role").prefetch_related("employees")
            ),
            "loan_officer"
        )

        officers = {}
        team_leaders = {}
        processors = {}

        for loan in loans:
            if loan.loan_officer:
                officers[loan.loan_officer.id] = loan.loan_officer.name

            for ra in loan.role_assignments.all():
                if ra.role.name.lower() == "lead":
                    for emp in ra.employees.all():
                        team_leaders[emp.id] = emp.name

                if ra.role.name.lower() == "processor":
                    for emp in ra.employees.all():
                        processors[emp.id] = emp.name

        return Response({
            "loan_officers": [{"id": k, "name": v} for k, v in officers.items()],
            "team_leaders": [{"id": k, "name": v} for k, v in team_leaders.items()],
            "processors": [{"id": k, "name": v} for k, v in processors.items()],
        })


# -----------------------------
# LINKED PROCESSORS BY TEAM LEAD
# -----------------------------
class TeamLeadProcessorsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        team_lead_id = request.query_params.get("team_leader")
        if not team_lead_id:
            return Response({"processors": []})

        loans = Loan.objects.filter(
            role_assignments__role__name__icontains="lead",
            role_assignments__employees__id=team_lead_id
        ).prefetch_related(
            Prefetch(
                "role_assignments",
                queryset=LoanRoleAssignment.objects.select_related("role").prefetch_related("employees")
            )
        ).distinct()

        processors = {}

        for loan in loans:
            for ra in loan.role_assignments.all():
                if ra.role.name.lower() == "processor":
                    for emp in ra.employees.all():
                        processors[emp.id] = emp.name

        return Response({
            "processors": [{"id": k, "name": v} for k, v in processors.items()]
        })
