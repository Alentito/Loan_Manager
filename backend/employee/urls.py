from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BrokerViewSet,
    LoanOfficerViewSet,
    validate_loan_officer,
    validate_broker,
    export_brokers_xml,
    export_brokers_csv,
    export_loan_officers_csv,
    export_loan_officers_xml,
    EmployeeViewSet,
    export_employees_xml,
    export_employees_csv,
    employee_login,
    get_employee_attendance,
    PublicHolidayViewSet, 
    MeetingViewSet
)
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'brokers', BrokerViewSet, basename='broker')
router.register(r'loan-officers', LoanOfficerViewSet, basename='loan-officer')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'public-holidays', PublicHolidayViewSet, basename='public-holiday')
router.register(r'meetings', MeetingViewSet, basename='meeting')


urlpatterns = [
    path('loan-officers/validate/', validate_loan_officer),
    path('validate/', validate_broker),

    # Broker exports
    path('brokers/export-csv/', export_brokers_csv, name='export_brokers_csv'),
    path('brokers/export-xml/', export_brokers_xml, name='export_brokers_xml'),

    # Loan Officer exports — **Add these**
    path('loan-officers/export-xml/', export_loan_officers_xml, name='export-loan-officers-xml'),
    path('loan-officers/export-csv/', export_loan_officers_csv, name='export-loan-officers-csv'),
    
    path('employees/export-csv/', export_employees_csv),
    path('employees/export-xml/', export_employees_xml),
    

    # ✅ Employee login + attendance
    path('employees/login/', employee_login, name='employee_login'),
    path('employees/<int:employee_id>/attendance/', get_employee_attendance, name='employee_attendance'),

    
    # Include router URLs last
    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
