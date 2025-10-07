from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter

from .views import (
    BrokerViewSet, LoanOfficerViewSet, EmployeeViewSet, PublicHolidayViewSet,
    MeetingViewSet, LeaveRequestViewSet, ShiftViewSet, TeamViewSet,
    validate_loan_officer, validate_broker,
    BreakViewSet, AttendanceViewSet, MonthlyAttendanceSummaryViewSet,
    export_brokers_excel, export_brokers_pdf,   # ✅ exports
    export_loan_officers_excel, export_loan_officers_pdf,
    export_employees_excel, export_employees_pdf,
    export_lenders_excel, export_lenders_pdf,
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

    # ✅ Broker exports (moved out of /brokers/ to avoid router clash)
    path('export/brokers/excel/', export_brokers_excel, name='export_brokers_excel'),
    path('export/brokers/pdf/', export_brokers_pdf, name='export_brokers_pdf'),

    # Loan Officer exports
    path('export/loan-officers/excel/', export_loan_officers_excel, name='export-loan-officers-excel'),
    path('export/loan-officers/pdf/', export_loan_officers_pdf, name='export-loan-officers-pdf'),


    # Employee exports
    path('export/employees/pdf/', export_employees_pdf, name='export-employees-pdf'),
    path('export/employees/excel/', export_employees_excel, name='export-employees-excel'),
    # Leave Requests by Employee
    path('leave-requests/employee/<int:employee_id>/', LeaveRequestViewSet.as_view({'get': 'by_employee'})),

    path('export/lenders/excel/', export_lenders_excel, name='export-lenders-excel'),
    path('export/lenders/pdf/', export_lenders_pdf, name='export-lenders-pdf'),
    path("lenders/validate/", validate_lender_field, name="validate_lender"),

    # ViewSet endpoints
    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
