# backend/employee/urls.py
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from .views import (
    BrokerViewSet, LoanOfficerViewSet, EmployeeViewSet, PublicHolidayViewSet,
    MeetingViewSet, LeaveRequestViewSet, ShiftViewSet, TeamViewSet,
    

    # Validation
    validate_loan_officer, validate_broker,

    BreakViewSet,AttendanceViewSet, MonthlyAttendanceSummaryViewSet,

    # Export Views
    export_brokers_excel, export_brokers_pdf,
    export_loan_officers_csv, export_loan_officers_xml,
    export_employees_csv, export_employees_xml,
    LenderViewSet, validate_lender_field,
    TeamLeadViewSet, TeamManagerViewSet,
    EmployeeTokenViewSet, EmployeeBreakViewSet
)

# Routers for ViewSets

router = DefaultRouter()
router.register(r'brokers', BrokerViewSet, basename='broker')
router.register(r'loan-officers', LoanOfficerViewSet, basename='loan-officer')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'public-holidays', PublicHolidayViewSet, basename='public-holiday')
router.register(r'meetings', MeetingViewSet, basename='meeting')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leave-request')
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'breaks', BreakViewSet, basename='break')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'monthly-summaries', MonthlyAttendanceSummaryViewSet, basename="monthly-summary")
router.register(r'lenders', LenderViewSet, basename="lender")
router.register(r'team-leads', TeamLeadViewSet, basename="teamlead")
router.register(r'team-managers', TeamManagerViewSet, basename="team-manager")
router.register(r'tokens', EmployeeTokenViewSet, basename='employee-token')
router.register(r'employee-break', EmployeeBreakViewSet, basename='employee-break')


urlpatterns = [

    # Validation APIs

    path('loan-officers/validate/', validate_loan_officer),
    path('validate/', validate_broker),

    # Broker exports
    path('brokers/export-csv/', export_brokers_excel, name='export_brokers_csv'),
    path('brokers/export-xml/', export_brokers_pdf, name='export_brokers_xml'),

    # Loan Officer exports — **Add these**
    path('loan-officers/export-xml/', export_loan_officers_xml, name='export-loan-officers-xml'),
    path('loan-officers/export-csv/', export_loan_officers_csv, name='export-loan-officers-csv'),
    
    path('employees/export-csv/', export_employees_csv),
    path('employees/export-xml/', export_employees_xml),
    


    # Leave Requests by Employee
    path('leave-requests/employee/<int:employee_id>/', LeaveRequestViewSet.as_view({'get': 'by_employee'})),
    path("lenders/validate/", validate_lender_field, name="validate_lender"),
    # ViewSet endpoints

    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)