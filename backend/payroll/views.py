from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, filters, decorators, response, status
from .models import IncentiveRule, PayrollSettings, EmployeePayroll
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings
from datetime import date
from calendar import monthrange
from rest_framework import viewsets, permissions, filters, response
from rest_framework.decorators import action
from django.db import transaction
from django.db.models import Q
from .models import IncentiveRule, PayrollSettings, EmployeePayroll
from .serializers import IncentiveRuleSerializer, PayrollSettingsSerializer, EmployeePayrollSerializer
from employee.models import Employee
from payroll.payroll_calculator import PayrollCalculator


from datetime import date, timedelta
from payroll.payroll_calculator import PayrollCalculator
from rest_framework.decorators import action


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
    

class SendEmailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = request.data or {}
        to = data.get("to") or data.get("recipients") or []
        subject = (data.get("subject") or "").strip()
        message = (data.get("message") or data.get("body") or "").strip()

        if isinstance(to, str):
            to = [e.strip() for e in to.split(",") if e.strip()]

        if not to or not subject or not message:
            return Response({"detail": "to, subject, message required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=to,
                fail_silently=False,
            )
            return Response({"sent": len(to)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PayrollPagination:
    # lightweight in-file pagination class
    class PageNumberPagination:
        page_size = 10
        page_size_query_param = "page_size"
        max_page_size = 200

class IncentiveRuleViewSet(viewsets.ModelViewSet):
    queryset = IncentiveRule.objects.all().order_by("-priority","min_files")
    serializer_class = IncentiveRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["milestone__name", "roles__name"]          # fix FK search
    ordering_fields = ["roles__name", "milestone__name", "min_files", "amount_per_file"]  # fix FK ordering

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
    queryset = EmployeePayroll.objects.all().select_related("employee").order_by("-month","employee__name")


    def get_queryset(self):
        qs = self.queryset
        month_param = self.request.query_params.get("month")
        if month_param:
            # Accept YYYY-MM
            try:
                y, m = map(int, month_param.split("-"))
                qs = qs.filter(month__year=y, month__month=m)
            except Exception:
                # Return empty instead of 400
                return EmployeePayroll.objects.none()

        user = self.request.user
        if user.is_superuser or user.has_perm("payroll.view_employeepayroll"):
            return qs
        try:
            emp = Employee.objects.get(user=user)
            return qs.filter(employee=emp)
        except Employee.DoesNotExist:
            return EmployeePayroll.objects.none()

    @action(detail=False, methods=["post"], url_path="generate", permission_classes=[permissions.IsAuthenticated])
    def generate(self, request):
        month_str = request.data.get("month")
        save = bool(request.data.get("save", True))
        if not month_str:
            return response.Response({"detail": "month required (YYYY-MM)"}, status=400)
        try:
            year, month = map(int, month_str.split("-"))
            period_start = date(year, month, 1)
            period_end = date(year, month, monthrange(year, month)[1])
        except Exception:
            return response.Response({"detail": "invalid month format"}, status=400)

        calculator = PayrollCalculator(period_start, period_end)
        computations = calculator.run()

        if not save:
            preview = [
                {
                    "employee": c.employee.name,
                    "base_pay": str(c.base_pay),
                    "incentive": str(c.incentive_pay),
                    "gross": str(c.gross_pay),
                    "deductions": str(c.statutory_deductions),
                    "net": str(c.net_pay),
                    "loans_count": c.loans_count,
                }
                for c in computations
            ]
            return response.Response({"preview": preview, "count": len(preview)})

        with transaction.atomic():
            saved = calculator.save_computations(computations, status="draft")
        ser = self.get_serializer(saved, many=True)
        return response.Response(ser.data, status=201)