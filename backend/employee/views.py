#employee/views.py
from django.http import HttpResponse
from .models import Broker, LoanOfficer, Employee, PublicHoliday,Meeting, LeaveRequests, Shift, Team,  Break, Attendance, MonthlyAttendanceSummary, Lender, TeamLead, TeamManager, EmployeeToken, EmployeeBreak, AttendanceLog
from rest_framework import viewsets, status, filters, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .serializers import BrokerSerializer, LoanOfficerSerializer, EmployeeSerializer,  PublicHolidaySerializer, MeetingSerializer, LeaveRequestSerializer, ShiftSerializer, TeamSerializer, BreakSerializer, AttendanceSerializer,  MonthlyAttendanceSummarySerializer, LenderSerializer, TeamLeadSerializer, TeamManagerSerializer,EmployeeTokenSerializer, EmployeeBreakSerializer
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, action, permission_classes
from django.http import JsonResponse
from rest_framework.response import Response
from datetime import timedelta
import xml.etree.ElementTree as ET
import csv
import json
import os, re
from datetime import date, timedelta
import calendar
from django.utils import timezone
from rest_framework import permissions
#from .permissions import IsAdminOrTeamManager
from rest_framework.permissions import AllowAny
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from rest_framework.permissions import BasePermission, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
import pytz
# from pytz import timezone as pytz_timezone  # Removed unused import
from datetime import datetime
from io import BytesIO
from reportlab.pdfgen import canvas
from rest_framework_simplejwt.authentication import JWTAuthentication
import openpyxl
from openpyxl.utils import get_column_letter
from reportlab.lib.pagesizes import letter
from django.utils import timezone
import logging
from rest_framework import viewsets, permissions
from django.contrib.auth.models import Group, Permission
from rest_framework import generics, status
import json
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.middleware import csrf
from django.contrib.auth.models import Group
from rest_framework.permissions import DjangoModelPermissions
from django.db.models import Count
from .utils import today_cst, mark_attendance_for_leave
from .utils import now_cst
from django.db.models import Prefetch
from django.db.models import Sum, F, ExpressionWrapper, DurationField, IntegerField, Case, When, Value
from .utils import to_cst, add_us_holidays, get_cst_date
from django.utils.dateparse import parse_date
from django.contrib.auth.decorators import permission_required
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone as dj_timezone
from django.db.models.functions import TruncMonth



class StrictDjangoModelPermissions(DjangoModelPermissions):
    # Require view permission for GET
    perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }


logger = logging.getLogger(__name__)
current_time = timezone.localtime(timezone.now())  # Respect server's timezone


# ✅ Custom Pagination (no max page size)
class BrokerPagination(PageNumberPagination):
    page_size = 10  # default
    page_size_query_param = 'page_size'  # allows frontend to override
    max_page_size = 1000  # no max limit

# ✅ Main API ViewSet
class BrokerViewSet(viewsets.ModelViewSet):
    permission_classes = [StrictDjangoModelPermissions]
    queryset = Broker.objects.all()
    serializer_class = BrokerSerializer
    parser_classes = (MultiPartParser, FormParser)
    pagination_class = BrokerPagination

    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'email', 'NMLS']
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at'] 

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.is_archived and not instance.archived_at:
            instance.archived_at = timezone.now()
        elif not instance.is_archived:
            instance.archived_at = None
        instance.save()

    def get_queryset(self):
     
        archived = self.request.query_params.get("archived")
        queryset = Broker.objects.all().order_by('-created_at')

        if archived == "true":
            queryset = queryset.filter(is_archived=True)
        elif archived == "false":
            queryset = queryset.filter(is_archived=False)

        search = self.request.query_params.get('search')
        place = self.request.query_params.get('place')
        nmls = self.request.query_params.get('nmls')
        company = self.request.query_params.get('company')

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search))
        if place:
            queryset = queryset.filter(Q(address__icontains=place) | Q(company_address__icontains=place))
        if nmls:
            queryset = queryset.filter(NMLS__icontains=nmls)
        if company:
            queryset = queryset.filter(company_address__icontains=company)

        return queryset

  
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        broker_obj = self.get_object()
        broker_obj.is_archived = True
        broker_obj.archived_at = timezone.now()
        broker_obj.save()
        return Response({"message": "Broker archived successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        broker_obj = self.get_object()
        if not broker_obj.is_archived:
            return Response({"error": "Broker is not archived"}, status=status.HTTP_400_BAD_REQUEST)
        broker_obj.is_archived = False
        broker_obj.archived_at = None
        broker_obj.save()
        return Response({"message": "Broker unarchived successfully"}, status=status.HTTP_200_OK)
    

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
@api_view(['GET'])
def validate_broker(request):
    email = request.query_params.get('email')
    phone = request.query_params.get('phone')
    primary_phone = request.query_params.get('primary_phone')
    NMLS = request.query_params.get('NMLS')
    exclude_id = request.query_params.get('exclude_id')

    errors = {}

    # Example check for unique email excluding current broker
    if email:
        qs = Broker.objects.filter(email=email)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['email'] = 'Email already exists.'

    if phone:
        qs = Broker.objects.filter(phone=phone)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['phone'] = 'Phone number already exists.'

    if primary_phone:
        qs = Broker.objects.filter(primary_phone=primary_phone)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['primary_phone'] = 'Primary phone already exists.'

    if NMLS:
        qs = Broker.objects.filter(NMLS=NMLS)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['NMLS'] = 'NMLS number already exists.'

    return Response({'errors': errors})# Add similar checks for phone, primary_phone, NMLS...


@api_view(['GET'])
def broker_stats(request):
    from .models import broker
    from django.utils import timezone
    total = Broker.objects.count()
    this_week = Broker.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
    last_updated = Broker.objects.latest('updated_at').updated_at if broker.objects.exists() else None

    return Response({
        'total': total,
        'this_week': this_week,
        'last_updated': last_updated,
    })


from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import openpyxl
from openpyxl.utils import get_column_letter
from openpyxl import Workbook
from io import BytesIO
from loan.models import Broker  # update import as needed


@api_view(['GET'])
@permission_classes([AllowAny])
def export_brokers_excel(request):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Brokers"

    headers = [
        'Name', 'Email', 'NMLS', 'Primary Phone', 'Phone',
        'Address', 'Company Address', 'Created At', 'Updated At', 'Archived At'
    ]
    ws.append(headers)

    for broker in Broker.objects.all().order_by('-created_at'):
        ws.append([
            broker.name or '-',
            broker.email or '-',
            broker.NMLS or '-',
            broker.primary_phone or '-',
            broker.phone or '-',
            broker.address or '-',
            broker.company_address or '-',
            broker.created_at.strftime('%Y-%m-%d %H:%M:%S') if broker.created_at else '-',
            broker.updated_at.strftime('%Y-%m-%d %H:%M:%S') if broker.updated_at else '-',
            broker.archived_at.strftime('%Y-%m-%d %H:%M:%S') if broker.archived_at else '-',
        ])

    # Auto-adjust column width
    for col_num, _ in enumerate(headers, 1):
        ws.column_dimensions[get_column_letter(col_num)].width = 25

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="brokers.xlsx"'
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def export_brokers_pdf(request):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50
    p.setFont("Helvetica-Bold", 14)
    p.drawString(200, y, "Broker Details Report")
    y -= 30
    p.setFont("Helvetica", 10)

    brokers = Broker.objects.all().order_by('-created_at')
    for broker in brokers:
        details = [
            f"Name: {broker.name or '-'}",
            f"Email: {broker.email or '-'}",
            f"NMLS: {broker.NMLS or '-'}",
            f"Primary Phone: {broker.primary_phone or '-'}",
            f"Phone: {broker.phone or '-'}",
            f"Address: {broker.address or '-'}",
            f"Company Address: {broker.company_address or '-'}",
            f"Created At: {broker.created_at.strftime('%Y-%m-%d %H:%M:%S') if broker.created_at else '-'}",
            f"Updated At: {broker.updated_at.strftime('%Y-%m-%d %H:%M:%S') if broker.updated_at else '-'}",
            f"Archived At: {broker.archived_at.strftime('%Y-%m-%d %H:%M:%S') if broker.archived_at else '-'}",
        ]

        for line in details:
            p.drawString(50, y, line)
            y -= 15
            if y < 50:  # new page if needed
                p.showPage()
                p.setFont("Helvetica", 10)
                y = height - 50

        y -= 10
        p.line(50, y, width - 50, y)
        y -= 20

    p.save()
    buffer.seek(0)
    return HttpResponse(buffer, content_type='application/pdf', headers={
        'Content-Disposition': 'attachment; filename="brokers.pdf"',
    })


def clean_xml_text(text):
    if text is None:
        return ''
    # Remove control chars except tab, newline, carriage return
    cleaned = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F]', '', str(text))
    return cleaned


def destroy(self, request, *args, **kwargs):
    instance = self.get_object()
    print(f"🗑️ Deleting broker: {instance.id}")
    self.perform_destroy(instance)
    return Response(status=status.HTTP_204_NO_CONTENT)



class LoanOfficerViewSet(viewsets.ModelViewSet):
    queryset = LoanOfficer.objects.select_related('broker_company').all().order_by('-created_at')
    serializer_class = LoanOfficerSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'contact_number', 'NMLS', 'broker_company__name']
    ordering_fields = ['created_at', 'updated_at', 'name']
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [StrictDjangoModelPermissions]

    
    def perform_create(self, serializer):
        instance = serializer.save()
        # if created already marked archived, set archived_at
        if getattr(instance, 'is_archived', False) and not getattr(instance, 'archived_at', None):
            instance.archived_at = timezone.now()
            instance.save()

    def perform_update(self, serializer):
        instance = serializer.save()
        if getattr(instance, 'is_archived', False) and not getattr(instance, 'archived_at', None):
            instance.archived_at = timezone.now()
        elif not getattr(instance, 'is_archived', False):
            instance.archived_at = None
        instance.save()

    def get_queryset(self):
     
        archived = self.request.query_params.get("archived")
        queryset = LoanOfficer.objects.select_related('broker_company').all().order_by('-created_at')

        if archived == "true":
            queryset = queryset.filter(is_archived=True)
        elif archived == "false":
            queryset = queryset.filter(is_archived=False)
        else:
            # default behavior: show only active (not archived)
            queryset = queryset.filter(is_archived=False)

        # optional additional filters
        search = self.request.query_params.get('search')
        nmls = self.request.query_params.get('nmls')
        broker = self.request.query_params.get('broker')

        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(email__icontains=search))
        if nmls:
            queryset = queryset.filter(NMLS__icontains=nmls)
        if broker:
            queryset = queryset.filter(broker_company__name__icontains=broker)

        return queryset
    
    def list(self, request, *args, **kwargs):
        if request.query_params.get('all') == 'true':
            self.pagination_class = None
        return super().list(request, *args, **kwargs)


    def destroy(self, request, *args, **kwargs):
        officer = self.get_object()
        if officer.is_archived:
            return Response({"error": "Loan officer already archived"}, status=status.HTTP_400_BAD_REQUEST)
        officer.is_archived = True
        officer.archived_at = timezone.now()
        officer.save()
        return Response({"message": "Loan officer archived (soft-deleted) successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        officer = self.get_object()
        if officer.is_archived:
            return Response({"error": "Loan officer already archived"}, status=status.HTTP_400_BAD_REQUEST)
        officer.is_archived = True
        officer.archived_at = timezone.now()
        officer.save()
        return Response({"message": "Loan officer archived successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='unarchive')
    def unarchive(self, request, pk=None):
        try:
            officer = LoanOfficer.objects.get(pk=pk, is_archived=True)
            officer.is_archived = False
            officer.archived_at = None
            officer.save()
            return Response({"message": "Loan officer unarchived successfully"}, status=status.HTTP_200_OK)
        except LoanOfficer.DoesNotExist:
            return Response({"error": "Archived loan officer not found"}, status=status.HTTP_404_NOT_FOUND)
    
@api_view(['POST'])
def validate_loan_officer(request):
    email = request.data.get('email')
    phone = request.data.get('phone')
    nmls = request.data.get('nmls')
    exclude_id = request.data.get('exclude_id')

    errors = {}

    try:
        exclude_id = int(exclude_id) if exclude_id else None
    except ValueError:
        exclude_id = None

    base_qs = LoanOfficer.objects.all()
    if exclude_id:
        base_qs = base_qs.exclude(id=exclude_id)

    if email and base_qs.filter(email=email).exists():
        errors['email'] = ['Email already exists.']
    if phone and base_qs.filter(contact_number=phone).exists():
        errors['phone'] = ['Phone number already exists.']
    if nmls and base_qs.filter(NMLS=nmls).exists():
        errors['nmls'] = ['NMLS already exists.']

    if errors:
        return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

    return Response({'message': 'Valid data'}, status=status.HTTP_200_OK)


@api_view(['GET']) 
@permission_classes([AllowAny])
def export_loan_officers_excel(request):
    wb = Workbook()
    ws = wb.active
    ws.title = "Loan Officers"

    headers = ['Name', 'Email', 'Contact Number', 'NMLS', 'Broker Company', 'Created At', 'Updated At']
    ws.append(headers)

    for officer in LoanOfficer.objects.select_related('broker_company').all():
        ws.append([
            officer.name or '',
            officer.email or '',
            officer.contact_number or '',
            officer.NMLS or '',
            officer.broker_company.name if officer.broker_company else '',
            officer.created_at.strftime('%Y-%m-%d %H:%M:%S') if officer.created_at else '',
            officer.updated_at.strftime('%Y-%m-%d %H:%M:%S') if officer.updated_at else '',
        ])

    for col_num, _ in enumerate(headers, 1):
        ws.column_dimensions[get_column_letter(col_num)].width = 20

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="loan_officers.xlsx"'
    wb.save(response)
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def export_loan_officers_pdf(request):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    # Title
    p.setFont("Helvetica-Bold", 14)
    p.drawString(200, y, "Loan Officer Details Report")
    y -= 30
    p.setFont("Helvetica", 10)

    officers = LoanOfficer.objects.select_related('broker_company').all().order_by('-created_at')

    for officer in officers:
        details = [
            f"Name: {officer.name or '-'}",
            f"Email: {officer.email or '-'}",
            f"Contact Number: {officer.contact_number or '-'}",
            f"NMLS: {officer.NMLS or '-'}",
            f"Broker Company: {officer.broker_company.name if officer.broker_company else '-'}",
            f"Created At: {officer.created_at.strftime('%Y-%m-%d %H:%M:%S') if officer.created_at else '-'}",
            f"Updated At: {officer.updated_at.strftime('%Y-%m-%d %H:%M:%S') if officer.updated_at else '-'}",
        ]

        for line in details:
            p.drawString(50, y, line)
            y -= 15
            if y < 50:  # new page if needed
                p.showPage()
                p.setFont("Helvetica", 10)
                y = height - 50

        y -= 10
        p.line(50, y, width - 50, y)
        y -= 20

    p.save()
    buffer.seek(0)

    return HttpResponse(buffer, content_type='application/pdf', headers={
        'Content-Disposition': 'attachment; filename="loan_officers.pdf"',
    })


class EmployeePagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 1000  # now can fetch all employees


class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [StrictDjangoModelPermissions]
    queryset = Employee.objects.select_related('team', 'primary_shift').all().order_by('-created_at')
    serializer_class = EmployeeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['position', 'status']  # ✅ Removed 'manager'
    filterset_fields = [ 'team', 'primary_shift', 'team__manager']  # ✅ Removed 'manager'
    search_fields = ['name', 'login_id', 'company_email', 'contact_number']
    ordering_fields = ['created_at','name']
    pagination_class = EmployeePagination


    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        employee_id = data.get('login_id')
        employee_password = data.get('login_password')
        roles = data.get('roles', [])

        # Normalize incoming roles into a list of ints
        role_ids = []
        if roles in (None, ""):
            role_ids = []
        elif isinstance(roles, str):
            import json
            try:
                parsed = json.loads(roles)
                role_ids = parsed if isinstance(parsed, list) else [parsed]
            except Exception:
                role_ids = [r.strip() for r in roles.split(",") if r.strip()]
        elif isinstance(roles, (list, tuple)):
            role_ids = list(roles)
        else:
            role_ids = [roles]

        try:
            role_ids = [int(r) for r in role_ids]
        except Exception:
            pass

        if not employee_id or not employee_password:
            return Response({'detail': 'login_id and login_password are required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=employee_id).exists():
            return Response({'detail': 'User with this login_id already exists.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Create Django User
                user = User.objects.create_user(username=employee_id, password=employee_password)

                if role_ids:
                    groups_qs = Group.objects.filter(pk__in=role_ids)
                    user.groups.set(groups_qs)

                data['user'] = user.id
                data.pop('login_password', None)  # never persist plain password

                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                employee = serializer.save()

                # ✅ Archive handling
                if getattr(employee, 'is_archived', False):
                    employee.archived_at = timezone.now()
                    employee.save(update_fields=["archived_at"])
                    # ❌ Disable User login if archived
                    user.is_active = False
                    user.save(update_fields=["is_active"])
                else:
                    # make sure active employees can log in
                    user.is_active = True
                    user.save(update_fields=["is_active"])

                # defensive sync: employee.roles ←→ user.groups
                if hasattr(employee, "roles"):
                    employee.roles.set(user.groups.all())

                out_serializer = self.get_serializer(employee)
                headers = self.get_success_headers(out_serializer.data)
                return Response(out_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except Exception as e:
            return Response({'detail': 'Error creating employee', 'error': str(e)},
                            status=status.HTTP_400_BAD_REQUEST)
        
        
    def perform_update(self, serializer):
        instance = serializer.save()  # team & shift logic already handled

        user = getattr(instance, "user", None)
        data = self.request.data

        if user:
            # Sync login_id
            new_login_id = data.get("login_id")
            if new_login_id and user.username != new_login_id:
                if User.objects.filter(username=new_login_id).exclude(pk=user.pk).exists():
                    raise ValidationError({"login_id": "This login_id is already taken."})
                user.username = new_login_id

            # Sync password
            new_password = data.get("login_password")
            if new_password:
                user.set_password(new_password)

            # Sync roles
            roles = data.get("roles", [])
            if isinstance(roles, str):
                try:
                    roles = json.loads(roles)
                except Exception:
                    roles = [r.strip() for r in roles.split(",") if r.strip()]
            if not isinstance(roles, (list, tuple)):
                roles = [roles]

            role_ids = [int(r) for r in roles if str(r).isdigit()]
            groups_qs = Group.objects.filter(pk__in=role_ids)
            user.groups.set(groups_qs)
            if hasattr(instance, "roles"):
                instance.roles.set(groups_qs)

            # Archive flag
            if getattr(instance, 'is_archived', False):
                if not instance.archived_at:
                    instance.archived_at = timezone.now()
                user.is_active = False
            else:
                instance.archived_at = None
                user.is_active = True

            user.save()

            # Issue new tokens
            refresh = RefreshToken.for_user(user)
            instance._new_tokens = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }

        return instance

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        employee = self.get_object()

        # If perform_update created new tokens, attach them
        if hasattr(employee, "_new_tokens"):
            response.data["tokens"] = employee._new_tokens

        return response
    
    def get_queryset(self):
        
        queryset = Employee.objects.select_related('team', 'primary_shift').all().order_by('-created_at')
        is_archived = self.request.query_params.get("is_archived")
        

        if is_archived == "true":
            queryset = queryset.filter(is_archived=True)
        elif is_archived == "false":
            queryset = queryset.filter(is_archived=False)
        else:
            queryset = queryset.filter(is_archived=False)

        role_param = self.request.query_params.get("role")
        if role_param:
            try:
                # if numeric, filter by ID
                if role_param.isdigit():
                    queryset = queryset.filter(roles__id=int(role_param))
                else:
                    queryset = queryset.filter(roles__name__iexact=role_param)
            except Group.DoesNotExist:
                pass
            
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(login_id__icontains=search) |
                Q(company_email__icontains=search)
            )
        manager_id = self.request.query_params.get("manager")
        if manager_id:
            queryset = queryset.filter(team__manager_id=manager_id)
        return queryset


    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()

        if employee.is_archived:
            return Response(
                {"error": "Employee already archived"},
                status=status.HTTP_400_BAD_REQUEST
            )

        employee.is_archived = True
        employee.archived_at = timezone.now()
        employee.save(update_fields=["is_archived", "archived_at"])

        # disable linked user if exists
        if getattr(employee, "user_id", None):
            employee.user.is_active = False
            employee.user.save(update_fields=["is_active"])

        return Response({"message": "Employee archived successfully"}, status=status.HTTP_200_OK)

    

    @action(detail=True, methods=['post'], url_path='unarchive')
    def unarchive(self, request, pk=None):
        try:
            employee = Employee.objects.get(pk=pk, is_archived=True)
            employee.is_archived = False
            employee.archived_at = None
            employee.save(update_fields=["is_archived", "archived_at"])

            # re-enable login
            if getattr(employee, "user_id", None):
                employee.user.is_active = True
                employee.user.save(update_fields=["is_active"])

            return Response({"message": "Employee unarchived successfully"}, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({"error": "Archived employee not found"}, status=status.HTTP_404_NOT_FOUND)


    def list(self, request, *args, **kwargs):
        if request.query_params.get('all') == 'true':
            self.pagination_class = None
            queryset = self.filter_queryset(self.get_queryset())
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=["get"], url_path="Managers")
    def get_managers(self, request):
        
        manager_employees = Employee.objects.filter(roles__name__iexact="Manager", is_archived=False)
        serializer = self.get_serializer(manager_employees, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="Leads")
    def get_leads(self, request):
        
        lead_employees = Employee.objects.filter(roles__name__iexact="Lead", is_archived=False)
        serializer = self.get_serializer(lead_employees, many=True)
        return Response(serializer.data)
    
@api_view(['GET'])
@permission_classes([AllowAny])
def export_employees_excel(request):
    wb = Workbook()
    ws = wb.active
    ws.title = "Employees"

    headers = ['Name', 'Email', 'Contact Number', 'Designation', 'Team', 'Joining Date', 'Created At', 'Updated At']
    ws.append(headers)

    employees = Employee.objects.select_related('designation', 'team').all().order_by('-created_at')

    for emp in employees:
        ws.append([
            emp.name or '',
            emp.company_email or '',
            emp.contact_number or '',
            emp.designation.name if emp.designation else '',
            emp.team.name if emp.team else '',
            getattr(emp, 'joining_date', '-') if getattr(emp, 'joining_date', None) else '-',
            emp.created_at.strftime('%Y-%m-%d %H:%M:%S') if emp.created_at else '',
            emp.updated_at.strftime('%Y-%m-%d %H:%M:%S') if emp.updated_at else '',
        ])

    for col_num, _ in enumerate(headers, 1):
        ws.column_dimensions[get_column_letter(col_num)].width = 20

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="employees.xlsx"'
    wb.save(response)
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def export_employees_pdf(request):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    # Title
    p.setFont("Helvetica-Bold", 14)
    p.drawString(180, y, "Employee Details Report")
    y -= 30
    p.setFont("Helvetica", 10)

    employees = Employee.objects.select_related('designation', 'team').all().order_by('-created_at')

    for emp in employees:
        details = [
            f"Name: {emp.name or '-'}",
            f"Email: {emp.company_email or '-'}",
            f"Contact Number: {emp.contact_number or '-'}",
            f"Designation: {emp.designation.name if emp.designation else '-'}",
            f"Team: {emp.team.name if emp.team else '-'}",
            f"Joining Date: {getattr(emp, 'joining_date', '-') if getattr(emp, 'joining_date', None) else '-'}",
            f"Created At: {emp.created_at.strftime('%Y-%m-%d %H:%M:%S') if emp.created_at else '-'}",
            f"Updated At: {emp.updated_at.strftime('%Y-%m-%d %H:%M:%S') if emp.updated_at else '-'}",
        ]

        for line in details:
            p.drawString(50, y, line)
            y -= 15
            if y < 50:  # new page if needed
                p.showPage()
                p.setFont("Helvetica", 10)
                y = height - 50

        y -= 10
        p.line(50, y, width - 50, y)
        y -= 20

    p.save()
    buffer.seek(0)

    return HttpResponse(
        buffer,
        content_type='application/pdf',
        headers={'Content-Disposition': 'attachment; filename="employees.pdf"'},
    )

@api_view(["POST"])
def validate_employee_field(request):
    """Check if login_id or company_email is unique."""
    field = request.data.get("field")
    value = request.data.get("value")

    if not field or not value:
        return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

    if field not in ["login_id", "company_email"]:
        return Response({"error": "Invalid field"}, status=status.HTTP_400_BAD_REQUEST)

    exists = Employee.objects.filter(**{field: value}).exists()
    return Response({"exists": exists})

class LargeResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'  # ✅ allow override from frontend
    max_page_size = 10000

class PublicHolidayViewSet(viewsets.ModelViewSet):
    queryset = PublicHoliday.objects.all().order_by('date') 
    serializer_class = PublicHolidaySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['date']
    search_fields = ['title']
    ordering_fields = ['date', 'title']
    ordering = ['date']
    pagination_class = LargeResultsSetPagination

    def perform_create(self, serializer):
        # Ensure stored date is CST-normalized
        date = serializer.validated_data.get("date")
        serializer.save(date=get_cst_date(date))

    def perform_update(self, serializer):
        date = serializer.validated_data.get("date")
        serializer.save(date=get_cst_date(date))
    
    @action(detail=False, methods=["post"], url_path="sync-us", permission_classes=[IsAuthenticated])
    def sync_us(self, request):

        add_us_holidays()
        return Response({"detail": "US holidays added successfully."}, status=status.HTTP_200_OK)
    
class UnlimitedPagination(PageNumberPagination):
    page_size = 10000  # or any very high number
    page_size_query_param = None

class MeetingViewSet(viewsets.ModelViewSet):
    serializer_class = MeetingSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = UnlimitedPagination

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'employee'):
            return Meeting.objects.filter(employees=user.employee)
        return Meeting.objects.none()

    def perform_create(self, serializer):
        meeting = serializer.save()
        if hasattr(self.request.user, 'employee'):
            meeting.employees.add(self.request.user.employee)

    def perform_update(self, serializer):
        meeting = serializer.save()
        # Ensure the updating user is still included in employees
        if hasattr(self.request.user, 'employee'):
            meeting.employees.add(self.request.user.employee)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        events = []
        for m in queryset:
            dt_cst = to_cst(m.datetime)
            events.append({
                "id": m.id,
                "title": m.title,
                "start": dt_cst.isoformat(),  # ISO string with CST offset
                "description": m.description,
            })
        return Response(events)


User = get_user_model()

class IsTeamManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if not hasattr(request.user, 'employee'):
            return False
        position = request.user.employee.roles
        return position in ['team_manager', 'team_lead']
    

class LeaveRequestPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequests.objects.all()
    serializer_class = LeaveRequestSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee']
    search_fields = ['reason', 'leave_type','employee__login_id', 'employee__name', 'employee__user__username']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-created_at']
    pagination_class = LeaveRequestPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequests.objects.all() if user.has_perm("employee.approve_leave") or user.has_perm("employee.deny_leave") else LeaveRequests.objects.filter(employee=user.employee)

        date_str = self.request.query_params.get("date")
        if date_str:
            date_obj = get_cst_date(date_str)
            if date_obj:
                date_obj = date_obj.date()
                qs = qs.filter(start_date__lte=date_obj, end_date__gte=date_obj)
                return qs

        # --- Date range filter ---
        start_str = self.request.query_params.get("start_date")
        end_str = self.request.query_params.get("end_date")
        if start_str and end_str:
            start_obj = get_cst_date(start_str)
            end_obj = get_cst_date(end_str)
            if start_obj and end_obj:
                qs = qs.filter(start_date__lte=end_obj, end_date__gte=start_obj)
                return qs

        # --- Default: current CST month ---
        today = today_cst()
        start_of_month = today.replace(day=1)
        next_month = (start_of_month + timedelta(days=32)).replace(day=1)
        end_of_month = next_month - timedelta(days=1)

        return qs.filter(start_date__lte=end_of_month, end_date__gte=start_of_month)


    @action(detail=True, methods=["post"], url_path="approve")
    def approve_request(self, request, pk=None):
        with transaction.atomic():
            leave = self.get_object()
            employee = leave.employee

            if leave.employee == request.user.employee:
                return Response({"detail": "You cannot approve your own leave request."}, status=403)

            if not request.user.has_perm("employee.approve_leave"):
                return Response({"detail": "Not authorized"}, status=403)

            if leave.status != "pending":
                return Response({"detail": "Already processed"}, status=400)

            approval_type = request.data.get("approval_type")
            if approval_type:
                approval_type = str(approval_type).strip().lower()

            if approval_type not in ["paid", "unpaid"]:
                return Response(
                    {"detail": "approval_type must be 'paid' or 'unpaid'."},
                    status=400
                )

            # --- Apply balance + fallback logic ---
            leave_days = (leave.end_date - leave.start_date).days + 1
            final_type = approval_type

            if approval_type == "paid":
            # Deduct full leave days from balance, allow negative
                employee.leave_balance -= leave_days
                final_type = "paid" if employee.leave_balance >= 0 else "unpaid"
            else:
                # Unpaid leave
                if employee.leave_balance <= 0:
                    # If balance is 0 or negative, continue decreasing
                    employee.leave_balance -= leave_days
                final_type = "unpaid"

            # Save updated leave balance
            employee.save(update_fields=["leave_balance"])

            # --- Update leave record ---
            leave.status = "approved"
            leave.approval_type = final_type
            leave.approved_by = request.user
            leave.processed_at = now_cst()
            leave.save()

            # --- Mark attendance ---
            mark_attendance_for_leave(
                leave.employee,
                leave.start_date,
                leave.end_date,
                approved=True,
                leave_type=final_type
            )

            return Response(LeaveRequestSerializer(leave).data, status=200)


    @action(detail=True, methods=["post"], url_path="deny")
    def deny_request(self, request, pk=None):
        with transaction.atomic():
            leave = self.get_object()

            # Prevent self-denial
            if leave.employee == request.user.employee:
                return Response(
                    {"detail": "You cannot deny your own leave request."},
                    status=403
                )

            if not request.user.has_perm("employee.deny_leave"):
                return Response({"detail": "Not authorized"}, status=403)

            if leave.status != "pending":
                return Response({"detail": "Already processed"}, status=400)

            leave.status = "denied"
            leave.denied_by = request.user
            leave.approval_type = None 
            leave.processed_at = now_cst()
            leave.save()
            mark_attendance_for_leave(
                leave.employee,
                leave.start_date,
                leave.end_date,
                approved=False,
                leave_type="denied"
            )

            return Response(LeaveRequestSerializer(leave).data, status=200)


    # Extra endpoint for employee-wise leaves
    @action(detail=False, methods=['get'], url_path='employee/(?P<employee_id>[^/.]+)')
    def by_employee(self, request, employee_id=None):
        if not employee_id or not str(employee_id).isdigit():
            return Response({"detail": "Invalid employee id"}, status=400)

        qs = self.get_queryset().filter(employee_id=int(employee_id))
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

class ShiftPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'  # allows frontend to override
    max_page_size = 1000 

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })
    

class ShiftViewSet(viewsets.ModelViewSet):
    permission_classes = [StrictDjangoModelPermissions]
    queryset = Shift.objects.all()  # do NOT order_by here
    serializer_class = ShiftSerializer
    pagination_class = ShiftPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['id', 'name', 'start_time', 'end_time', 'created_at', 'updated_at']
    ordering = ['-id']

    def get_queryset(self):
        qs = super().get_queryset()
        query = self.request.query_params.get("search", None)
        if query:
            qs = qs.filter(name__icontains=query)
        return qs

class TeamPagination(PageNumberPagination):
    page_size = 1000  # or whatever default page size you prefer
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })

class TeamViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Team.objects.select_related("head", "manager", "shift").all()
    serializer_class = TeamSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "head__name", "manager__name", "shift__name"]
    ordering_fields = ["id", "name", "manager__name", "head__name", "shift__name", "created_at", "updated_at"]
    ordering = ["-created_at"]  # default sort
    pagination_class = TeamPagination




class BreakViewSet(viewsets.ModelViewSet):
    queryset = Break.objects.all()
    serializer_class = BreakSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="start")
    def start_break(self, request):
        """Start a break for the current user's active attendance today (CST)."""
        try:
            attendance = Attendance.objects.get(
                employee=request.user.employee,
                date=today_cst(),   # ✅ CST date
            )
        except Attendance.DoesNotExist:
            return Response({"detail": "No attendance record for today"}, status=400)

        # prevent multiple open breaks
        if attendance.breaks.filter(break_out__isnull=True).exists():
            return Response({"detail": "You already have an ongoing break"}, status=400)

        brk = Break.objects.create(attendance=attendance)
        serializer = self.get_serializer(brk)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=["post"], url_path="end")
    def end_break(self, request, pk=None):
        """End a break and recalc attendance worked minutes."""
        brk = self.get_object()

        if brk.break_out:
            return Response({"detail": "Break already ended"}, status=400)

        brk.close_break()  
        brk.attendance.recalc_worked_minutes()  
        serializer = self.get_serializer(brk)
        return Response(serializer.data, status=200)
    

    
class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().select_related("employee", "shift").prefetch_related(
        Prefetch("breaks", queryset=Break.objects.all())
    )
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]
    pagination_class = None 
    
    def get_queryset(self):
        print("Query params:", self.request.query_params)
        user = self.request.user
        qs = super().get_queryset()

        employee_id = self.request.query_params.get("employeeId")

        if employee_id:
            try:
                employee_id = int(employee_id)
                employee_obj = Employee.objects.get(pk=employee_id)
            except (ValueError, Employee.DoesNotExist):
                return qs.none()

            # Case 1: self-view → always allow
            if hasattr(user, "employee") and user.employee.id == employee_id:
                qs = qs.filter(employee=employee_obj)

            # Case 2: others → need permission
            elif user.is_superuser or user.has_perm("employee.view_employee"):
                qs = qs.filter(employee=employee_obj)

            # Case 3: not allowed
            else:
                return qs.none()

        else:
            # No employeeId given → default to logged-in employee
            if hasattr(user, "employee") and not user.is_superuser:
                qs = qs.filter(employee=user.employee)
            elif user.is_superuser:
                # superuser can see all if no filter
                pass
            else:
                return qs.none()

        # Month/year filtering
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")

        if month and year:
            qs = qs.filter(date__month=int(month), date__year=int(year))
        else:
            today = today_cst()
            qs = qs.filter(date__month=today.month, date__year=today.year)

        return qs.order_by("date")


    @action(detail=False, methods=["get"], url_path="today")
    def today_attendance(self, request):
        """
        Return today’s attendance for the logged-in employee
        """
        attendance = self.get_queryset().filter(date=today_cst()).first()
        if not attendance:
            return Response({"detail": "No attendance record for today"}, status=404)

        serializer = self.get_serializer(attendance)
        return Response(serializer.data)

       
    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        user = request.user
        employee_id = request.query_params.get("employeeId")

        # Use CST time for year reference
        now_cst = to_cst(timezone.now())
        year = int(request.query_params.get("year") or now_cst.year)

        # Resolve employee
        if not employee_id:
            if hasattr(user, "employee"):
                employee_id = user.employee.id
            else:
                return Response({"detail": "Employee ID is required"}, status=400)

        try:
            employee = Employee.objects.get(id=int(employee_id))
        except (ValueError, Employee.DoesNotExist):
            return Response({"detail": "Employee not found"}, status=404)

        # Permission check
        if hasattr(user, "employee") and user.employee.id != employee.id:
            if not (user.is_superuser or user.has_perm("employee.view_employee")):
                return Response({"detail": "Not allowed"}, status=403)

        # ✅ Grace-aware yearly late total (CST aligned)
        adjusted_minutes = (
            Attendance.objects.filter(employee=employee, date__year=year)
            .aggregate(
                total_adjusted=Sum(
                    Case(
                        When(
                            minutes_late__gt=F("shift__grace_period_minutes"),
                            then=F("minutes_late") - F("shift__grace_period_minutes"),
                        ),
                        default=Value(0),
                        output_field=IntegerField(),
                    )
                )
            )["total_adjusted"]
            or 0
        )

        # Format time
        total_seconds = adjusted_minutes * 60
        hh = total_seconds // 3600
        mm = (total_seconds % 3600) // 60
        ss = total_seconds % 60

        return Response(
            {
                "employee_id": employee.id,
                "employee_name": employee.name,
                "leave_balance": employee.leave_balance,
                "year": year,
                "yearly_late_minutes": adjusted_minutes,
                "yearly_late_seconds": total_seconds,
                "yearly_late_hhmmss": f"{hh:02d}:{mm:02d}:{ss:02d}",
            }
        )

    # ✅ MONTHLY SUMMARY (CST safe + grace aware)
    @action(detail=False, methods=["get"], url_path="monthly-summary")
    def monthly_summary(self, request):
        user = request.user
        employee_id = request.query_params.get("employeeId")

        now_cst = to_cst(timezone.now())
        year = int(request.query_params.get("year") or now_cst.year)

        # Resolve employee
        if not employee_id:
            if hasattr(user, "employee"):
                employee_id = user.employee.id
            else:
                return Response({"detail": "Employee ID is required"}, status=400)

        try:
            employee = Employee.objects.get(id=int(employee_id))
        except (ValueError, Employee.DoesNotExist):
            return Response({"detail": "Employee not found"}, status=404)

        # Permission check
        if hasattr(user, "employee") and user.employee.id != employee.id:
            if not (user.is_superuser or user.has_perm("employee.view_employee")):
                return Response({"detail": "Not allowed"}, status=403)

        # ✅ CST-aligned query (grace-aware)
        monthly_qs = (
            Attendance.objects.filter(employee=employee, date__year=year)
            .annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(
                total_adjusted=Sum(
                    Case(
                        When(
                            minutes_late__gt=F("shift__grace_period_minutes"),
                            then=F("minutes_late") - F("shift__grace_period_minutes"),
                        ),
                        default=Value(0),
                        output_field=IntegerField(),
                    )
                )
            )
            .order_by("month")
        )

        # JSON clean output
        raw_by_month = {row["month"].month: row["total_adjusted"] or 0 for row in monthly_qs}

        result = []
        for m in range(1, 13):
            adjusted_minutes = raw_by_month.get(m, 0)
            seconds = adjusted_minutes * 60
            hrs = seconds // 3600
            mins = (seconds % 3600) // 60
            secs = seconds % 60
            result.append(
                {
                    "month": m,
                    "month_name": calendar.month_name[m],
                    "late_minutes": adjusted_minutes,
                    "total_late_seconds": seconds,
                    "late_hhmmss": f"{hrs:02d}:{mins:02d}:{secs:02d}",
                }
            )

        return Response(
            {
                "employee_id": employee.id,
                "employee_name": employee.name,
                "year": year,
                "monthly": result,
            }
        )
    

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        employee = queryset.first().employee if queryset.exists() else None

        leave_summary = {}
        if employee:
            # Year for summary
            year = int(request.query_params.get("year") or timezone.now().astimezone(CST).year)

            # Calculate yearly late in seconds
            total_minutes = Attendance.objects.filter(
                employee=employee,
                date__year=year
            ).aggregate(total_late=Sum("minutes_late"))["total_late"] or 0

            total_seconds = total_minutes * 60
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            hh_mm_ss = f"{int(hours):02d}:{int(minutes):02d}:{int(seconds):02d}"

            leave_summary = {
                "leave_balance": employee.leave_balance,
                "yearly_late_hhmmss": hh_mm_ss,
                "yearly_late_seconds": total_seconds,  # ✅ new field
            }

        serializer = self.get_serializer(
            queryset, many=True, context={"leave_summary": leave_summary}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=["get"], url_path="monthly-worked-hours")
    def monthly_worked_hours(self, request):
        employee_id = request.query_params.get("employeeId")
        month = int(request.query_params.get("month", 0))
        year = int(request.query_params.get("year", 0))

        if not (employee_id and month and year):
            return Response({"error": "employeeId, month, year required"}, status=400)

        attendances = (
            Attendance.objects.filter(
                employee_id=employee_id,
                date__year=year,
                date__month=month,
            )
            .select_related("shift")
            .prefetch_related("logs", "breaks")
            .order_by("date")
        )

        total_seconds = 0
        per_day_data = []

        for record in attendances:
            daily_seconds = record.calculate_effective_work_seconds()
            total_seconds += daily_seconds
            per_day_data.append({
                "date": record.date,
                "worked_seconds": daily_seconds,
                "worked_hhmmss": str(timedelta(seconds=int(daily_seconds))),
                "shift": record.shift.name if record.shift else None,
            })

        return Response({
            "employee": employee_id,
            "month": month,
            "year": year,
            "total_worked_seconds": int(total_seconds),
            "total_worked_hhmmss": str(timedelta(seconds=int(total_seconds))),
            "per_day": per_day_data,
        })

    
    @action(detail=False, methods=["get"], url_path="late-logins")
    def late_logins(self, request):
        """
        Return employees who logged in late for a specific day/week/month (CST aligned)
        Supports optional calendar date (?date=YYYY-MM-DD)
        """
        tz = pytz.timezone("America/Chicago")

        filter_type = request.query_params.get("filter", "day")  # day | week | month
        date_param = request.query_params.get("date")

        now = datetime.now(tz)

        # ------------------ Resolve Selected Date ------------------
        if date_param:
            selected_date = parse_date(date_param)
            if not selected_date:
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=400
                )
        else:
            selected_date = now.date()

        # ------------------ Determine Date Range ------------------
        if filter_type == "day":
            start_date = selected_date
            end_date = selected_date

        elif filter_type == "week":
            start_date = selected_date - timedelta(days=selected_date.weekday())
            end_date = start_date + timedelta(days=6)

        elif filter_type == "month":
            start_date = selected_date.replace(day=1)
            next_month = (start_date + timedelta(days=32)).replace(day=1)
            end_date = next_month - timedelta(days=1)

        else:
            return Response({"error": "Invalid filter"}, status=400)

        default_grace_period = 10  # minutes

        # ------------------ Query Late Attendance ------------------
        qs = (
            Attendance.objects.filter(
                date__range=[start_date, end_date],
                status=Attendance.STATUS_LATE
            )
            .select_related("employee", "employee__user", "shift")
            .order_by("-date", "employee__user__username")
        )

        # ------------------ Build Response ------------------
        results = []

        for att in qs:
            emp = att.employee
            user = getattr(emp, "user", None)

            # Grace period (shift-level or default)
            grace = (
                att.shift.grace_period_minutes
                if getattr(att, "shift", None) and att.shift.grace_period_minutes
                else default_grace_period
            )

            # Late duration
            minutes_late = att.minutes_late or 0
            adjusted_minutes = max(0, minutes_late - grace)
            total_seconds = adjusted_minutes * 60

            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60

            late_duration = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

            # Login time in CST
            if att.login_time:
                login_time = (
                    pytz.UTC.localize(att.login_time)
                    if timezone.is_naive(att.login_time)
                    else att.login_time
                )
                login_time = login_time.astimezone(tz).strftime("%Y-%m-%d %I:%M:%S %p")
            else:
                login_time = "N/A"

            results.append({
                "employee_id": getattr(emp, "employee_code", emp.id),
                "employee_name": (
                    user.get_full_name()
                    if user and user.get_full_name()
                    else user.username if user else "N/A"
                ),
                "date": att.date.strftime("%Y-%m-%d"),
                "status": att.status,
                "login_time": login_time,
                "late_duration": late_duration,
                "shift_name": getattr(att.shift, "name", "N/A"),
            })

        # ------------------ Final Response ------------------
        return Response({
            "filter": filter_type,
            "from": start_date.strftime("%Y-%m-%d"),
            "to": end_date.strftime("%Y-%m-%d"),
            "results": results,
        })

class PunchInView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        now = now_cst()
        today = today_cst()

        attendance, _ = Attendance.objects.get_or_create(
            employee=user.employee,
            date=today,
            defaults={"status": Attendance.STATUS_PRESENT}
        )

        last_log = attendance.logs.order_by("-login_time").first()
        if last_log and not last_log.logout_time:
            return Response({"detail": "Already punched in."}, status=400)

        AttendanceLog.objects.create(attendance=attendance, login_time=now)
        attendance.login_time = attendance.login_time or now
        attendance.save(update_fields=["login_time"])

        return Response({"detail": "Punch in recorded", "time": now})


class PunchOutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        now = now_cst()
        today = today_cst()

        try:
            attendance = Attendance.objects.get(employee=user.employee, date=today)
        except Attendance.DoesNotExist:
            return Response({"detail": "No attendance record for today."}, status=404)

        last_log = attendance.logs.order_by("-login_time").first()
        if not last_log or last_log.logout_time:
            return Response({"detail": "You have not punched in yet."}, status=400)

        last_log.logout_time = now
        last_log.save()

        total_minutes = attendance.total_worked_minutes()
        attendance.worked_minutes = total_minutes
        attendance.logout_time = now
        attendance.save(update_fields=["worked_minutes", "logout_time"])

        return Response({
            "detail": "Punch out recorded",
            "worked_minutes": total_minutes,
            "worked_hhmmss": str(timedelta(minutes=total_minutes)),
        })

class MonthlyAttendanceSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MonthlyAttendanceSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = MonthlyAttendanceSummary.objects.all()
        user = self.request.user

        # Restrict to employee unless superuser
        if hasattr(user, "employee") and not user.is_superuser:
            qs = qs.filter(employee=user.employee)
        elif not user.is_superuser:
            return qs.none()

        # Query params
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")

        if month and year:
            qs = qs.filter(month=int(month), year=int(year))
        else:
            # default: current CST month/year
            today = today_cst()
            qs = qs.filter(month=today.month, year=today.year)

        return qs


class LenderViewSet(viewsets.ModelViewSet):
    queryset = Lender.objects.all()  # default
    serializer_class = LenderSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ["lender_name", "executive_email", "manager_email", "account_executive_name"]
    filterset_fields = ["lender_name", "executive_email"]
    ordering_fields = ["created_at", "lender_name"]
    ordering = ["-created_at"]  # default ordering
    pagination_class = PageNumberPagination
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]

    def get_queryset(self):
       
        qs = super().get_queryset()
        archived = self.request.query_params.get("archived")
        if archived == "true":
            return qs.filter(is_archived=True)
        elif archived == "false":
            return qs.filter(is_archived=False)
        return qs
    
    def list(self, request, *args, **kwargs):
        if request.query_params.get('all') == 'true':
            self.pagination_class = None
        return super().list(request, *args, **kwargs)


    @action(detail=True, methods=["POST"])
    def archive(self, request, pk=None):
        """Archive a lender"""
        lender = self.get_object()
        lender.is_archived = True
        lender.archived_at = timezone.now()
        lender.save()
        return Response({"success": "Lender archived successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["POST"])
    def unarchive(self, request, pk=None):
        """Unarchive a lender"""
        lender = self.get_object()
        lender.is_archived = False
        lender.archived_at = None
        lender.save()
        return Response({"success": "Lender unarchived successfully"}, status=status.HTTP_200_OK)


@api_view(["POST"])
def validate_lender_field(request):
    """Check if executive email, phone, manager email, or contact is unique."""
    field = request.data.get("field")
    value = request.data.get("value")

    if not field or not value:
        return Response({"error": "Invalid request"}, status=status.HTTP_400_BAD_REQUEST)

    exists = Lender.objects.filter(**{field: value}).exists()
    return Response({"exists": exists})

@api_view(['GET'])
@permission_classes([AllowAny])
def export_lenders_excel(request):
    wb = Workbook()
    ws = wb.active
    ws.title = "Lenders"

    headers = [
        'Lender Name', 'Account Executive Name', 'Executive Email', 'Executive Phone', 'Executive Address',
        'Account Manager Name', 'Manager Email', 'Manager Contact', 'Manager Address',
        'Mortgage Clause', 'Created At'
    ]
    ws.append(headers)

    lenders = Lender.objects.all().order_by('-created_at')

    for lender in lenders:
        ws.append([
            lender.lender_name or '',
            lender.account_executive_name or '',
            lender.executive_email or '',
            lender.executive_phone or '',
            lender.executive_address or '',
            lender.account_manager_name or '',
            lender.manager_email or '',
            lender.manager_contact or '',
            lender.manager_address or '',
            lender.mortgage_clause or '',
            lender.created_at.strftime('%Y-%m-%d %H:%M:%S') if lender.created_at else '',
        ])

    for col_num, _ in enumerate(headers, 1):
        ws.column_dimensions[get_column_letter(col_num)].width = 25

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename="lenders.xlsx"'
    wb.save(response)
    return response

@api_view(['GET'])
@permission_classes([AllowAny])
def export_lenders_pdf(request):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    # Title
    p.setFont("Helvetica-Bold", 14)
    p.drawString(180, y, "Lender Details Report")
    y -= 30
    p.setFont("Helvetica", 10)

    lenders = Lender.objects.all().order_by('-created_at')

    for lender in lenders:
        details = [
            f"Lender Name: {lender.lender_name or '-'}",
            f"Account Executive Name: {lender.account_executive_name or '-'}",
            f"Executive Email: {lender.executive_email or '-'}",
            f"Executive Phone: {lender.executive_phone or '-'}",
            f"Executive Address: {lender.executive_address or '-'}",
            f"Account Manager Name: {lender.account_manager_name or '-'}",
            f"Manager Email: {lender.manager_email or '-'}",
            f"Manager Contact: {lender.manager_contact or '-'}",
            f"Manager Address: {lender.manager_address or '-'}",
            f"Mortgage Clause: {lender.mortgage_clause or '-'}",
            f"Created At: {lender.created_at.strftime('%Y-%m-%d %H:%M:%S') if lender.created_at else '-'}",
        ]

        for line in details:
            p.drawString(50, y, line)
            y -= 15
            if y < 50:
                p.showPage()
                p.setFont("Helvetica", 10)
                y = height - 50

        y -= 10
        p.line(50, y, width - 50, y)
        y -= 20

    p.save()
    buffer.seek(0)

    return HttpResponse(
        buffer,
        content_type='application/pdf',
        headers={'Content-Disposition': 'attachment; filename="lenders.pdf"'},
    )


class TeamLeadViewSet(viewsets.ModelViewSet):
    queryset = TeamLead.objects.all().prefetch_related("members", "lead")
    serializer_class = TeamLeadSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = [
        "lead__login_id",
        "lead__name",
        "members__login_id",
        "members__name",
    ]
    filterset_fields = ["lead", "members"]
    ordering_fields = ["created_at", "updated_at", "lead"]
    ordering = ["-created_at"]  # default ordering
    pagination_class = PageNumberPagination
    permission_classes = [IsAuthenticated]


class TeamManagerViewSet(viewsets.ModelViewSet):
    queryset = TeamManager.objects.all().prefetch_related("team_leads", "manager")
    serializer_class = TeamManagerSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ["manager__login_id", "manager__name", "team_leads__lead__login_id", "team_leads__lead__name"]
    filterset_fields = ["manager", "team_leads"]
    ordering_fields = ["created_at", "updated_at", "manager"]
    ordering = ["-created_at"]



class EmployeeTokenViewSet(viewsets.ModelViewSet):
    queryset = EmployeeToken.objects.all()
    serializer_class = EmployeeTokenSerializer
    permission_classes = [StrictDjangoModelPermissions]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee']
    search_fields = ['title', 'description', 'employee__username', 'responder__username']
    ordering_fields = ['created_at', 'responded_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.has_perm('employee.approve_tokens'):
            return EmployeeToken.objects.all()
        return EmployeeToken.objects.filter(employee=user)

    @action(detail=True, methods=["post"], url_path="respond")
    def respond_token(self, request, pk=None):
        token = self.get_object()

        # Permission check
        if not request.user.has_perm('employee.approve_tokens'):
            return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)

        # Already responded
        if token.status == "responded":
            return Response({"detail": "Already responded"}, status=status.HTTP_400_BAD_REQUEST)

        # Update response, status, and responder
        response_text = request.data.get("response", "").strip()
        if not response_text:
            return Response({"detail": "Response cannot be empty"}, status=status.HTTP_400_BAD_REQUEST)

        token.response = response_text
        token.status = "responded"  # or "resolved", depending on your model
        token.responder = request.user
        token.responded_at = timezone.now()  # optional if you track response timestamp
        token.save()

        serializer = self.get_serializer(token)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
from rest_framework.pagination import PageNumberPagination

class BreakPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'


class EmployeeBreakViewSet(viewsets.ModelViewSet):
    queryset = EmployeeBreak.objects.all()
    serializer_class = EmployeeBreakSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = BreakPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    def get_queryset(self):
        user = self.request.user
        qs = EmployeeBreak.objects.all()

        emp_id = (
            self.request.query_params.get("employeeId")
            or self.request.query_params.get("employee")
            or self.request.query_params.get("userId")
        )

        if emp_id:
            try:
                emp_id = int(emp_id)
            except ValueError:
                return EmployeeBreak.objects.none()

            # Fetch the User linked to the employee
            from employee.models import Employee
            try:
                employee_obj = Employee.objects.get(pk=emp_id)
            except Employee.DoesNotExist:
                return EmployeeBreak.objects.none()

            # Only allow fetching other employee if user has permission or is superuser
            if (hasattr(user, "employee") and user.employee.id == emp_id) or user.is_superuser or user.has_perm("employee.view_employee"):
                qs = qs.filter(employee=employee_obj.user)  # <-- Use user
            else:
                qs = qs.filter(employee=user)
        else:
            # Default: logged-in employee
            qs = qs.filter(employee=user)  # <-- Use user

        # Month/year filter
        month = self.request.query_params.get("month")
        year = self.request.query_params.get("year")
        if month and year:
            qs = qs.filter(start_time__month=int(month), start_time__year=int(year))
        print("DEBUG total_break_time queryset:", qs.values("id", "employee_id", "start_time", "end_time"))

        return qs.order_by("-start_time")


    def perform_create(self, serializer):
        # Save start_time as now in CST
        serializer.save(employee=self.request.user, start_time=now_cst())

    @action(detail=True, methods=["post"])
    def break_out(self, request, pk=None):
        break_instance = self.get_object()
        if break_instance.end_time is not None:
            return Response({"detail": "Already clocked out"}, status=400)
        
        break_instance.end_time = to_cst(timezone.now())
        break_instance.save()
        return Response(self.get_serializer(break_instance).data)

    @action(detail=False, methods=["get"])
    def total_break_time(self, request):
        emp_id = request.query_params.get("employee") or request.query_params.get("employeeId")
        qs = EmployeeBreak.objects.all()

        if emp_id:
            try:
                emp_id = int(emp_id)
                from employee.models import Employee
                employee_obj = Employee.objects.get(pk=emp_id)
                # permission check
                if (hasattr(request.user, "employee") and request.user.employee.id == emp_id) \
                or request.user.is_superuser \
                or request.user.has_perm("employee.view_employee"):
                    qs = qs.filter(employee=employee_obj.user)
                else:
                    qs = qs.filter(employee=request.user)
            except (ValueError, Employee.DoesNotExist):
                qs = qs.none()
        else:
            qs = qs.filter(employee=request.user)

        month = request.query_params.get("month")
        year = request.query_params.get("year")
        if month and year:
            qs = qs.filter(start_time__month=int(month), start_time__year=int(year))

        total = qs.annotate(
            duration=ExpressionWrapper(F('end_time') - F('start_time'), output_field=DurationField())
        ).aggregate(total_duration=Sum('duration'))

        return Response({"total_break_seconds": total['total_duration'].total_seconds() if total['total_duration'] else 0})


    @action(detail=False, methods=["get"])
    def daily_break_summary(self, request):
        qs = self.get_queryset()
        month = request.query_params.get("month")
        year = request.query_params.get("year")
        if month and year:
            qs = qs.filter(
                start_time__month=int(month),
                start_time__year=int(year)
            )

        qs = qs.annotate(
            duration=ExpressionWrapper(
                F('end_time') - F('start_time'),
                output_field=DurationField()
            )
        ).values('start_time__date').annotate(
            total_day_duration=Sum('duration')
        ).order_by('start_time__date')

        data = {
            str(item['start_time__date']): item['total_day_duration'].total_seconds()
            for item in qs if item['total_day_duration']
        }
        return Response(data)
    

    @action(detail=False, methods=["get"], url_path="active")
    def active_break(self, request):
        user = request.user  # User instance
        active_break = EmployeeBreak.objects.filter(
            employee=user,  # employee field points to User, not Employee
            end_time__isnull=True
        ).first()

        if active_break:
            return Response({
                "has_active_break": True,
                "break": {
                    "id": active_break.id,
                    "started_at": active_break.start_time,  # use 'start_time' instead of 'break_in'
                }
            })

        return Response({"has_active_break": False})
