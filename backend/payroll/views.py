from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, filters, decorators, response, status
from .models import IncentiveRule, PayrollSettings, EmployeePayroll
from .serializers import (
    IncentiveRuleSerializer,
    PayrollSettingsSerializer,
    EmployeePayrollSerializer,
)
from employee.models import Employee

class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff

class PayrollPagination:
    # lightweight in-file pagination class
    class PageNumberPagination:
        page_size = 10
        page_size_query_param = "page_size"
        max_page_size = 200

class IncentiveRuleViewSet(viewsets.ModelViewSet):
    queryset = IncentiveRule.objects.all().order_by("role__name", "milestone", "min_files")
    serializer_class = IncentiveRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["milestone", "role__name"]
    ordering_fields = ["role__name", "milestone", "min_files", "amount_per_file"]

class PayrollSettingsViewSet(viewsets.ModelViewSet):
    queryset = PayrollSettings.objects.all().order_by("-id")
    serializer_class = PayrollSettingsSerializer
    permission_classes = [permissions.IsAuthenticated]

    @decorators.action(detail=False, methods=["get"], url_path="current")
    def current(self, request):
        obj = PayrollSettings.objects.order_by("-id").first()
        if not obj:
            obj = PayrollSettings.objects.create()  # create with defaults
        ser = self.get_serializer(obj)
        return response.Response(ser.data)

class EmployeePayrollViewSet(viewsets.ModelViewSet):
    serializer_class = EmployeePayrollSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["employee", "month"]
    search_fields = ["employee__name", "employee__login_id", "employee__company_email"]
    ordering_fields = ["month", "gross_salary", "net_salary", "employee__name"]
    ordering = ["-month"]

    def get_queryset(self):
        user = self.request.user
        qs = EmployeePayroll.objects.select_related("employee").all()
        # Admin/HR with explicit permission sees all
        if user.is_superuser or user.has_perm("payroll.view_employeepayroll"):
            return qs
        # Regular employee: only own payrolls (if mapped)
        try:
            emp = Employee.objects.get(user=user)
            return qs.filter(employee=emp)
        except Employee.DoesNotExist:
            return EmployeePayroll.objects.none()

    @decorators.action(detail=False, methods=["get"], url_path="mine")
    def mine(self, request):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        if page is not None:
            ser = self.get_serializer(page, many=True)
            return self.get_paginated_response(ser.data)
        ser = self.get_serializer(qs, many=True)
        return response.Response(ser.data, status=status.HTTP_200_OK)