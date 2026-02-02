# backend/report/urls.py
from django.urls import path
from .views import (
    FundedLoanReportAPIView,
    BrokerLinkedEmployeesAPIView,
    TeamLeadProcessorsAPIView, LoanExportReportAPIView
)

urlpatterns = [
    path("funded-loans/", FundedLoanReportAPIView.as_view(), name="funded-loan-report"),
    path("broker-linked-employees/", BrokerLinkedEmployeesAPIView.as_view(), name="broker-linked-employees"),
    path("team-lead-processors/", TeamLeadProcessorsAPIView.as_view(), name="team-lead-processors"),
    path("loan-export/", LoanExportReportAPIView.as_view()),
]
