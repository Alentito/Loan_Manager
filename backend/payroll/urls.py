from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter
from .views import IncentiveRuleViewSet, PayrollSettingsViewSet, EmployeePayrollViewSet, SendEmailView

router = DefaultRouter()
router.register(r"incentive-rules", IncentiveRuleViewSet, basename="incentive-rule")
router.register(r"settings", PayrollSettingsViewSet, basename="payroll-settings")
router.register(r"payrolls", EmployeePayrollViewSet, basename="employee-payroll")

urlpatterns = router.urls



urlpatterns = [
    path('', include(router.urls)),
    path('send-email/', SendEmailView.as_view(), name='payroll-send-email'),
]

# Explicit export route (in addition to router) to avoid any router quirks
employee_payroll_export = EmployeePayrollViewSet.as_view({'get': 'export'})
urlpatterns += [
    path('payrolls/export/', employee_payroll_export, name='employee-payroll-export'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
