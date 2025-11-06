from django.urls import path
from .views import FundedLoanReportAPIView, LinkedEmployeesAPIView, BrokerLinkedEmployeesAPIView

urlpatterns = [
    path('funded-loans/', FundedLoanReportAPIView.as_view(), name='funded-loans'),
    path("funded-loans/linked-employees/", LinkedEmployeesAPIView.as_view(), name="linked-employees"),
    path("broker-linked-employees/", BrokerLinkedEmployeesAPIView.as_view(), name="broker-linked-employees"),

]
