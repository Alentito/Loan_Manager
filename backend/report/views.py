# backend/report/views.py
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Q
from loan.models import Loan, Milestone
from .serializers import LoanReportSerializer
from rest_framework.pagination import PageNumberPagination
from employee.views import StrictDjangoModelPermissions
from employee.utils import to_cst  # Import your CST converter
from rest_framework.views import APIView


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


class FundedLoanReportAPIView(ListAPIView):
    serializer_class = LoanReportSerializer
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        try:
            milestone_name = self.request.query_params.get("milestone", "Funded")
            broker_id = self.request.query_params.get("broker")
            officer_id = self.request.query_params.get("loan_officer")
            manager_id = self.request.query_params.get("manager")
            lead_id = self.request.query_params.get("team_leader")
            processor_id = self.request.query_params.get("processor")

            start_date = self.request.query_params.get("start_date")
            end_date = self.request.query_params.get("end_date")

            milestone = Milestone.objects.filter(name__iexact=milestone_name).first()
            if not milestone:
                print("⚠️ No milestone found for:", milestone_name)
                return Loan.objects.none()

            loans = Loan.objects.filter(milestone=milestone)

            if broker_id:
                loans = loans.filter(broker_id=broker_id)
            if officer_id:
                loans = loans.filter(loan_officer_id=officer_id)
            if manager_id:
                loans = loans.filter(team_manager_id=manager_id)
            if lead_id:
                loans = loans.filter(team_leader_id=lead_id)
            if processor_id:
                loans = loans.filter(processor_id=processor_id)

            if start_date and end_date:
                try:
                    start_cst = to_cst(start_date)
                    end_cst = to_cst(end_date)
                    loans = loans.filter(created_at__range=(start_cst, end_cst))
                except Exception as e:
                    print("⚠️ Invalid date range:", e)

            data = (
                loans.values(
                    "broker__name",
                    "loan_officer__name",
                    "team_manager__name",
                    "team_leader__name",
                    "processor__name",
                    "milestone",
                )
                .annotate(funded_count=Count("id"))
                .order_by("broker__name")
            )

            print("✅ FundedLoanReport data:", list(data))
            return data

        except Exception as e:
            import traceback
            print("❌ Error in FundedLoanReportAPIView:", e)
            traceback.print_exc()
            return Loan.objects.none()


    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if not queryset.exists():
            return Response({
                "results": [],
                "total_funded_loans": 0,
                "milestone": request.query_params.get("milestone", "Funded"),
                "message": "No funded loans found for the selected filters."
            }, status=200)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                "results": serializer.data,
                "total_funded_loans": queryset.count(),
                "milestone": request.query_params.get("milestone", "Funded"),
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "results": serializer.data,
            "total_funded_loans": queryset.count(),
            "milestone": request.query_params.get("milestone", "Funded"),
        })


class LinkedEmployeesAPIView(APIView):
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]

    def get(self, request, *args, **kwargs):
        broker_id = request.query_params.get("broker")
        if not broker_id:
            return Response({"loan_officers": [], "team_leaders": [], "processors": []})

        loans = Loan.objects.filter(broker_id=broker_id).select_related(
            "loan_officer", "team_leader", "processor"
        )

        officers = {l.loan_officer.id: l.loan_officer.name for l in loans if l.loan_officer}
        leads = {l.team_leader.id: l.team_leader.name for l in loans if l.team_leader}
        processors = {l.processor.id: l.processor.name for l in loans if l.processor}

        return Response({
            "loan_officers": [{"id": k, "name": v} for k, v in officers.items()],
            "team_leaders": [{"id": k, "name": v} for k, v in leads.items()],
            "processors": [{"id": k, "name": v} for k, v in processors.items()],
        })

class BrokerLinkedEmployeesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        broker_id = request.query_params.get("broker")
        if not broker_id:
            return Response({"error": "Broker ID is required."}, status=400)

        loans = Loan.objects.filter(broker_id=broker_id)

        loan_officers = (
            loans.values("loan_officer__id", "loan_officer__name")
            .distinct()
            .order_by("loan_officer__name")
        )

        team_leaders = (
            loans.values("team_leader__id", "team_leader__name")
            .distinct()
            .order_by("team_leader__name")
        )

        processors = (
            loans.values("processor__id", "processor__name")
            .distinct()
            .order_by("processor__name")
        )

        return Response({
            "loan_officers": list(loan_officers),
            "team_leaders": list(team_leaders),
            "processors": list(processors),
        })