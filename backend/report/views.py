from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q, Exists, OuterRef
from loan.models import Loan, Task
from employee.models import Employee
from .serializers import LoanReportSerializer
from employee.utils import to_cst
import logging

logger = logging.getLogger(__name__)


# -----------------------------
# Pagination
# -----------------------------
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


# -----------------------------
# FUNDING / MILESTONE REPORT
# -----------------------------
class FundedLoanReportAPIView(ListAPIView):
    serializer_class = LoanReportSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        request = self.request
        user = request.user

        # Start with all loans, but filter based on role & permissions
        qs = Loan.objects.all()

        # 🔐 Apply same visibility logic as LoanViewSet
        if not user.is_superuser and not user.has_perm("loan.view_all_loans"):
            try:
                employee = Employee.objects.get(user=user)
            except Employee.DoesNotExist:
                employee = None

            visibility_q = Q()
            if employee:
                visibility_q |= Q(team_manager=employee)
                visibility_q |= Q(team_leader=employee)
                visibility_q |= Q(processor=employee)
                visibility_q |= Q(support=employee)

            # Optional: creator visibility if applicable
            if hasattr(Loan, "created_by"):
                visibility_q |= Q(created_by=user)

            assigner_exists = Task.objects.filter(loan_id=OuterRef("pk"), assigner_id=user.id)
            assignee_exists = Task.objects.filter(loan_id=OuterRef("pk"), assignee_id=employee.id) if employee else Task.objects.none()

            qs = qs.annotate(
                is_assigner=Exists(assigner_exists),
                is_assignee=Exists(assignee_exists),
            ).filter(
                visibility_q | Q(is_assigner=True) | Q(is_assignee=True)
            )

        # Exclude archived unless requested
        include_archived = request.query_params.get("include_archived", "").lower()
        if include_archived != "true":
            qs = qs.filter(is_archived=False)

        # Optimize FKs
        select_related_fields = ["broker", "loan_officer", "team_leader", "team_manager", "processor", "support"]
        qs = qs.select_related(*[f for f in select_related_fields if hasattr(Loan, f)])

        # --- Apply filters ---
        broker_id = request.query_params.get("broker")
        officer_id = request.query_params.get("loan_officer")
        lead_id = request.query_params.get("team_leader")
        processor_id = request.query_params.get("processor")
        milestone = request.query_params.get("milestone") 
        start_date = request.query_params.get("start_date")
        end_date = request.query_params.get("end_date")

        if broker_id:
            qs = qs.filter(broker_id=broker_id)
        if officer_id:
            qs = qs.filter(loan_officer_id=officer_id)
        if lead_id:
            qs = qs.filter(team_leader_id=lead_id)
        if processor_id:
            qs = qs.filter(processor_id=processor_id)
        if milestone:  # ✅ filter by milestone (e.g. "Funded")
            qs = qs.filter(milestone=milestone)
            
        # 🗓 Filter by date range (loan creation)
        if start_date and end_date:
            try:
                start_cst = to_cst(start_date)
                end_cst = to_cst(end_date)
                qs = qs.filter(created_at__range=(start_cst, end_cst))
            except Exception as e:
                logger.warning(f"⚠️ Invalid date range: {e}")

        return qs

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()

        if not queryset.exists():
            return Response({
                "results": [],
                "message": "No data found for selected filters."
            }, status=200)

        # Group by milestone
        milestone_counts = (
            queryset.values("milestone")
            .annotate(count=Count("id"))
            .order_by("milestone")
        )

        results = [
            {"milestone": item["milestone"] or "Unknown", "count": item["count"]}
            for item in milestone_counts
        ]
        total_loans = sum(item["count"] for item in results)

        return Response({
            "results": results,
            "default_milestone": "Funded",
            "total_loans": total_loans
        })


# -----------------------------
# LINKED EMPLOYEES BY BROKER
# -----------------------------
class BrokerLinkedEmployeesAPIView(APIView):
    permission_classes = [IsAuthenticated]  # Simple auth

    def get(self, request, *args, **kwargs):
        broker_id = request.query_params.get("broker")
        if not broker_id:
            return Response({"loan_officers": [], "team_leaders": [], "processors": []})

        loans = Loan.objects.filter(broker_id=broker_id).select_related(
            "loan_officer", "team_leader", "processor"
        )

        officers = {}
        leads = {}
        processors = {}

        for loan in loans:
            if loan.loan_officer:
                officers[loan.loan_officer.id] = loan.loan_officer.name
            if loan.team_leader:
                leads[loan.team_leader.id] = loan.team_leader.name
            if loan.processor:
                processors[loan.processor.id] = {
                    "name": loan.processor.name,
                    "team_leader_id": loan.team_leader.id if loan.team_leader else None,
                }

        return Response({
            "loan_officers": [{"id": k, "name": v} for k, v in officers.items()],
            "team_leaders": [{"id": k, "name": v} for k, v in leads.items()],
            "processors": [{"id": k, "name": v["name"], "team_leader_id": v["team_leader_id"]} for k, v in processors.items()],
        })


# -----------------------------
# LINKED PROCESSORS BY TEAM LEAD
# -----------------------------
class TeamLeadProcessorsAPIView(APIView):
    permission_classes = [IsAuthenticated]  # Simple auth

    def get(self, request, *args, **kwargs):
        team_lead_id = request.query_params.get("team_leader")
        if not team_lead_id:
            return Response({"processors": []})

        loans = Loan.objects.filter(team_leader_id=team_lead_id).select_related("processor")

        processors = {l.processor.id: l.processor.name for l in loans if l.processor}

        return Response({
            "processors": [{"id": k, "name": v} for k, v in processors.items()]
        })
