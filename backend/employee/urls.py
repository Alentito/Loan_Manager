from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import CookieTokenRefreshView, CookieTokenObtainPairView

from .views import (
    BrokerViewSet, LoanOfficerViewSet, EmployeeViewSet, PublicHolidayViewSet,
    MeetingViewSet, LeaveRequestViewSet, ShiftViewSet, TeamViewSet,

    # Validation
    validate_loan_officer, validate_broker,

    # Auth & Attendance
    employee_login, employee_logout, get_employee_attendance,

    # Export Views
    export_brokers_excel, export_brokers_pdf,
    export_loan_officers_csv, export_loan_officers_xml,
    export_employees_csv, export_employees_xml,
    
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

urlpatterns = [
    # JWT Token
    path('token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),

    # Validation APIs
    path('loan-officers/validate/', validate_loan_officer),
    path('validate/', validate_broker),

    # Export: Brokers
    path('brokers/export/csv/', export_brokers_excel, name='export_brokers_csv'),
    path('brokers/export/xml/', export_brokers_pdf, name='export_brokers_xml'),

    # Export: Loan Officers
    path('loan-officers/export/csv/', export_loan_officers_csv, name='export_loan_officers_csv'),
    path('loan-officers/export/xml/', export_loan_officers_xml, name='export_loan_officers_xml'),

    # Export: Employees
    path('employees/export/csv/', export_employees_csv, name='export_employees_csv'),
    path('employees/export/xml/', export_employees_xml, name='export_employees_xml'),

   
    # Employee Auth & Attendance
    path('employees/login/', employee_login, name='employee_login'),
    path('employees/logout/', employee_logout, name='employee_logout'),
    path('employees/<int:employee_id>/attendance/', get_employee_attendance, name='employee_attendance'),

    # Leave Requests by Employee
    path('leave-requests/employee/<int:employee_id>/', LeaveRequestViewSet.as_view({'get': 'by_employee'})),

    # ViewSet endpoints
    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
