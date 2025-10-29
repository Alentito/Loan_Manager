from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework.routers import DefaultRouter
from .views import IncentiveRuleViewSet, PayrollSettingsViewSet, EmployeePayrollViewSet

router = DefaultRouter()
router.register(r"incentive-rules", IncentiveRuleViewSet, basename="incentive-rule")
router.register(r"settings", PayrollSettingsViewSet, basename="payroll-settings")
router.register(r"payrolls", EmployeePayrollViewSet, basename="employee-payroll")

urlpatterns = router.urls



urlpatterns = [
    path('', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
