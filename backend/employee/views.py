from django.http import HttpResponse
from .models import Broker, LoanOfficer, Employee, Attendance, PublicHoliday,Meeting, LeaveRequests, Shift, Team
from rest_framework import viewsets, status, filters, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .serializers import BrokerSerializer, LoanOfficerSerializer, EmployeeSerializer, AttendanceSerializer, PublicHolidaySerializer, MeetingSerializer, LeaveRequestSerializer, ShiftSerializer, TeamSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, action, permission_classes, authentication_classes
import xml.etree.ElementTree as ET
import csv
import pytz
import os, re
from django.db import transaction

from datetime import date, timedelta
import calendar
from django.utils import timezone
from django.utils.timezone import now, localdate
from .permissions import IsTeamManagerOrReadOnly
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
# views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.middleware import csrf
from django.contrib.auth.models import Group

from rest_framework.permissions import DjangoModelPermissions


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_brokers_excel(request):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Brokers"

    headers = ['Name', 'Email', 'NMLS', 'Primary Phone', 'Phone', 'Address', 'Company Address', 'Created At', 'Updated At']
    ws.append(headers)

    for broker in Broker.objects.all():
        ws.append([
            broker.name,
            broker.email,
            broker.NMLS,
            broker.primary_phone,
            broker.phone,
            broker.address,
            broker.company_address,
            broker.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            broker.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])

    for col_num, _ in enumerate(headers, 1):
        ws.column_dimensions[get_column_letter(col_num)].width = 20

    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = 'attachment; filename="brokers.xlsx"'
    wb.save(response)
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_brokers_pdf(request):
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    y = 750
    p.setFont("Helvetica", 10)

    p.drawString(200, 800, "Broker List")

    headers = ['Name', 'Email', 'NMLS', 'Primary Phone']
    p.drawString(50, y, ' | '.join(headers))
    y -= 20

    for broker in Broker.objects.all():
        line = f"{broker.name} | {broker.email} | {broker.NMLS} | {broker.primary_phone}"
        p.drawString(50, y, line)
        y -= 20
        if y < 50:
            p.showPage()
            y = 750

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

        # support all results without pagination
        if self.request.query_params.get('all') == 'true':
            return queryset

        return queryset

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
    
@api_view(['GET'])
def validate_loan_officer(request):
    email = request.GET.get('email')
    phone = request.GET.get('phone')
    nmls = request.GET.get('nmls')
    exclude_id = request.GET.get('exclude_id')

    errors = {}

    # Convert exclude_id to int or None safely
    try:
        exclude_id = int(exclude_id) if exclude_id else None
    except ValueError:
        exclude_id = None

    base_qs = LoanOfficer.objects.all()
    if exclude_id is not None:
        base_qs = base_qs.exclude(id=exclude_id)

    if email and base_qs.filter(email=email).exists():
        errors['email'] = 'Email already exists.'
    if phone and base_qs.filter(contact_number=phone).exists():
        errors['phone'] = 'Phone number already exists.'
    if nmls and base_qs.filter(NMLS=nmls).exists():
        errors['nmls'] = 'NMLS already exists.'

    return Response({'errors': errors})




@api_view(['GET'])
def export_loan_officers_xml(request):
    officers = LoanOfficer.objects.select_related('broker_company').all()

    root = ET.Element('LoanOfficers')

    for o in officers:
        officer_elem = ET.SubElement(root, 'LoanOfficer')
        ET.SubElement(officer_elem, 'Name').text = o.name or ''
        ET.SubElement(officer_elem, 'Email').text = o.email or ''
        ET.SubElement(officer_elem, 'Phone').text = o.contact_number or ''
        ET.SubElement(officer_elem, 'NMLS').text = o.NMLS or ''
        ET.SubElement(officer_elem, 'BrokerCompany').text = o.broker_company.name if o.broker_company else ''
        ET.SubElement(officer_elem, 'CreatedAt').text = o.created_at.isoformat() if o.created_at else ''

    xml_bytes = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    response = HttpResponse(xml_bytes, content_type='application/xml')
    response['Content-Disposition'] = 'attachment; filename="loan_officers.xml"'
    return response


@api_view(['GET'])
def export_loan_officers_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="loan_officers.csv"'

    writer = csv.writer(response)
    writer.writerow(['Name', 'Email', 'Phone', 'NMLS', 'BrokerCompany', 'CreatedAt'])

    for o in LoanOfficer.objects.select_related('broker_company').all():
        writer.writerow([
            o.name,
            o.email,
            o.contact_number,
            o.NMLS,
            o.broker_company.name if o.broker_company else '',
            o.created_at.strftime('%Y-%m-%d %H:%M:%S') if o.created_at else '',
        ])

    return response

class EmployeePagination(PageNumberPagination):
    page_size = 10
    max_page_size = 1000  # <--- allow large pages
    page_size_query_param = 'page_size'

class EmployeeViewSet(viewsets.ModelViewSet):
    permission_classes = [StrictDjangoModelPermissions]
    queryset = Employee.objects.select_related('team', 'primary_shift').all().order_by('-created_at')
    serializer_class = EmployeeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [ 'team', 'primary_shift']  # ✅ Removed 'manager'
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

                # 🔥 Archive timestamp logic (merge teammate’s code)
                if getattr(employee, 'is_archived', False) and not getattr(employee, 'archived_at', None):
                    employee.archived_at = timezone.now()
                    employee.save(update_fields=["archived_at"])

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
        instance = serializer.save()
        if getattr(instance, 'is_archived', False) and not getattr(instance, 'archived_at', None):
            instance.archived_at = timezone.now()
        elif not getattr(instance, 'is_archived', False):
            instance.archived_at = None
        instance.save()

    def get_queryset(self):
        archived = self.request.query_params.get("archived")
        queryset = Employee.objects.select_related('team', 'primary_shift').all().order_by('-created_at')

        if archived == "true":
            queryset = queryset.filter(is_archived=True)
        elif archived == "false":
            queryset = queryset.filter(is_archived=False)
        else:
            queryset = queryset.filter(is_archived=False)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(login_id__icontains=search) |
                Q(company_email__icontains=search)
            )

        return queryset

    def destroy(self, request, *args, **kwargs):
        employee = self.get_object()
        if employee.is_archived:
            return Response({"error": "Employee already archived"}, status=status.HTTP_400_BAD_REQUEST)
        employee.is_archived = True
        employee.archived_at = timezone.now()
        employee.save()
        return Response({"message": "Employee archived successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        employee = self.get_object()
        if employee.is_archived:
            return Response({"error": "Employee already archived"}, status=status.HTTP_400_BAD_REQUEST)
        employee.is_archived = True
        employee.archived_at = timezone.now()
        employee.save()
        return Response({"message": "Employee archived successfully"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='unarchive')
    def unarchive(self, request, pk=None):
        try:
            employee = Employee.objects.get(pk=pk, is_archived=True)
            employee.is_archived = False
            employee.archived_at = None
            employee.save()
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
    
class IsManager(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.employee.roles == 'manager'


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def export_employees_csv(request):
    if not request.user.is_authenticated:
        return HttpResponse("Unauthorized", status=401)

    employees = Employee.objects.all()

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="employees.csv"'

    writer = csv.writer(response)
    writer.writerow(['ID', 'Name', 'Email', 'Phone'])  # Add more fields if needed

    for emp in employees:
        writer.writerow([emp.id, emp.name, emp.company_email, emp.contact_number])

    return response


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def export_employees_xml(request):
    if not request.user.is_authenticated:
        return HttpResponse("Unauthorized", status=401)

    employees = Employee.objects.all()
    data = serializers.serialize('xml', employees)

    response = HttpResponse(data, content_type='application/xml')
    response['Content-Disposition'] = 'attachment; filename="employees.xml"'
    return response


def mark_attendance_on_login(employee):
    try:
        # ✅ Always get current time in CST
        #cst_tz = pytz.timezone('US/Central')
        cst_tz = pytz.timezone('America/Chicago')
        now_cst = timezone.now().astimezone(cst_tz)
        print(f"Current CST time: {now_cst}") 
        today_cst = now_cst.date()
        
        # Skip if already marked
        if Attendance.objects.filter(employee=employee, date=today_cst).exists():
            return

        # Skip if today is a holiday
        if PublicHoliday.objects.filter(date=today_cst).exists():
            return

        # Get employee's shift
        shift = employee.primary_shift or employee.alternate_shift
        if not shift:
            print(f"❌ No shift for {employee.login_id} ({employee.name}) - skipping")
            return

        print("umbbb*********")
        # Build datetime objects in CST
        shift_start_dt = cst_tz.localize(datetime.combine(today_cst, shift.start_time))
        shift_end_dt = cst_tz.localize(datetime.combine(today_cst, shift.end_time))

        # Handle overnight shifts (e.g., 9 PM to 5 AM next day)
        if shift_end_dt <= shift_start_dt:
            shift_end_dt += timedelta(days=1)

        # Grace period
        grace_minutes = 15
        grace_deadline = shift_start_dt + timedelta(minutes=grace_minutes)
        print('Grace deadline:', grace_deadline, 'Current time:', now_cst, 'Shift start:', shift_start_dt, 'shift',shift.start_time)

        # Attendance status logic
        if now_cst <= grace_deadline:
            status = 'present'
        else:
            status = 'late'


        Attendance.objects.create(
            employee=employee,
            date=today_cst,
            login_time=now_cst.time(),
            status=status
        )
        print(f"✅ Attendance marked as {status} for {employee.name} ({now_cst})")

    except Exception as e:
        print(f"[ERROR] mark_attendance_on_login failed for {employee.id}: {e}")


@api_view(['POST'])
@permission_classes([AllowAny])
def employee_login(request):
    login_id = request.data.get('login_id', '').strip()
    login_password = request.data.get('login_password', '').strip()

    if not login_id or not login_password:
        logger.warning("Login failed - missing login_id or password")
        return Response({'error': 'Login ID and password are required'}, status=400)

    logger.info(f"Login attempt - ID: {login_id}")
    

    try:
        employee = Employee.objects.get(login_id=login_id)
    except Employee.DoesNotExist:
        logger.warning(f"Login failed - Employee not found: {login_id}")
        return Response({'error': 'Invalid credentials'}, status=401)

    # Block login if archived
    if employee.is_archived:
        logger.warning(f"Login failed - Archived employee {login_id}")
        return Response({'error': 'This account is archived and cannot log in'}, status=403)

    # Check credentials
    if not employee.login_password:
        logger.warning(f"Login failed - No password set for {login_id}")
        return Response({'error': 'Credentials not set for employee'}, status=401)

    # Handles both plain text and hashed passwords
    if employee.login_password != login_password and not check_password(login_password, employee.login_password):
        logger.warning(f"Login failed - Wrong password for {login_id}")
        return Response({'error': 'Invalid credentials'}, status=401)

    # Mark attendance
    mark_attendance_on_login(employee)

    # Ensure a linked Django User exists
    username = f'emp_{employee.id}'
    user, created = User.objects.get_or_create(username=username)
    if created:
        user.set_password(login_password)  # Keep it consistent for Django auth
        user.save()

    if not employee.user:
        employee.user = user
        employee.save()

    # generate tokens / set cookies
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    res = Response({
        "message": "Login successful",
        "employee": {
            "id": employee.id,
            "login_id": employee.login_id,
            "name": employee.name,
            "designation": employee.designation.name if employee.designation else None,
        }
    }, status=200)

    res.set_cookie("access_token", access, httponly=True, secure=False, samesite="Lax", max_age=15*60, path="/")
    res.set_cookie("refresh_token", str(refresh), httponly=True, secure=False, samesite="Lax", max_age=7*24*3600, path="/")
    return res
    

@api_view(['POST'])
@permission_classes([AllowAny])   # allow clearing cookies even if token expired
def employee_logout(request):
    try:
        refresh_token = request.COOKIES.get('refresh_token') or request.data.get("refresh_token")
        # If provided, blacklist refresh token
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # token invalid or expired — ignore blacklist error, still clear cookies
                pass

        # Always remove cookies from the client
        res = Response({"detail": "Logout successful"}, status=200)
        res.delete_cookie('access_token', path='/', samesite='Lax')
        res.delete_cookie('refresh_token', path='/', samesite='Lax')
        return res

    except Exception as e:
        # return OK after attempting to clear cookies; this prevents client-side stuck state
        res = Response({"detail": "Logout attempted"}, status=200)
        res.delete_cookie('access_token', path='/', samesite='Lax')
        res.delete_cookie('refresh_token', path='/', samesite='Lax')
        return res

def update_late_status():
    from datetime import datetime, timedelta
    today = timezone.localdate()
    for att in Attendance.objects.filter(date=today, status='present'):
        emp = att.employee
        shift = emp.primary_shift or emp.alternate_shift
        if shift:
            grace_cutoff = (datetime.combine(today, shift.start_time) + timedelta(minutes=15)).time()
            if att.login_time and att.login_time > grace_cutoff:
                att.status = 'late'
                att.save()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_employee_calendar(request, employee_id):
    try:
        employee = Employee.objects.get(id=employee_id)
    except Employee.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=404)

    today = localdate()
    start_date = date(today.year, today.month, 1)
    end_date = date(today.year, today.month, 31)  # crude, works fine for now

    # Get attendance records for the month
    attendance_records = Attendance.objects.filter(
        employee=employee,
        date__range=(start_date, end_date)
    ).values('date', 'status')

    attendance_map = {rec['date']: rec['status'] for rec in attendance_records}

    # Get public holidays
    holidays = PublicHoliday.objects.filter(
        date__range=(start_date, end_date)
    ).values_list('date', flat=True)

    # Build final list
    results = []
    day = start_date
    while day <= end_date:
        if day in holidays:
            status = 'Holiday'
        elif day in attendance_map:
            status = attendance_map[day]
        else:
            status = 'Absent'

        results.append({
            'date': day.isoformat(),
            'status': status
        })
        day += timedelta(days=1)

    return Response(results)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_employee_attendance(request, employee_id):
    month = request.query_params.get('month')
    year = request.query_params.get('year')

    attendances = Attendance.objects.filter(employee_id=employee_id)
    if month and year:
        try:
            attendances = attendances.filter(date__month=int(month), date__year=int(year))
        except ValueError:
            pass

    attendances = attendances.order_by('date')
    serializer = AttendanceSerializer(attendances, many=True)
    return Response(serializer.data)


def update_attendance_and_leave_balance(employee):
    today = timezone.now().date()
    first_day = today.replace(day=1)
    last_day = today.replace(day=calendar.monthrange(today.year, today.month)[1])

    all_days = [first_day + timedelta(days=i) for i in range((last_day - first_day).days + 1)]
    
    for day in all_days:
        if day.weekday() == 6:  # Sunday (0=Monday, 6=Sunday)
            continue
        # Check if already marked
        if not Attendance.objects.filter(employee=employee, date=day).exists():
            Attendance.objects.create(employee=employee, date=day, status='leave')

    # Count present days in current month
    present_count = Attendance.objects.filter(
        employee=employee,
        date__month=today.month,
        date__year=today.year,
        status='present'
    ).count()

    working_days = len([d for d in all_days if d.weekday() != 6])
    leaves_taken = working_days - present_count
    employee.leave_balance = float(leaves_taken)
    employee.save()

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    employee_id = request.data.get('employee')
    try:
        employee = Employee.objects.get(id=employee_id)
        today = date.today()

        attendance, created = Attendance.objects.get_or_create(
            employee=employee, date=today,
            defaults={'status': 'present'}
        )
        if not created:
            return Response({'detail': 'Already marked'}, status=200)
        return Response({'detail': 'Attendance marked'})
    except Employee.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=404)


class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]
    #authentication_classes = []
    def post(self, request, *args, **kwargs):
        print( "hi")
        print("Refresh endpoint called")
        refresh_token = request.COOKIES.get('refresh_token')
        print("COOKIES:", request.COOKIES)
        print("refresh_token:", refresh_token)
        if not refresh_token:
            return Response({"detail": "Refresh token missing myree umfi"},
                            status=status.HTTP_401_UNAUTHORIZED)

        try:
            #token = RefreshToken(refresh_token)
            #access_token = str(token.access_token)

            old_refresh = RefreshToken(refresh_token)

            # Create new access + refresh tokens
            new_access = str(old_refresh.access_token)
            #new_refresh = str(RefreshToken.for_user(old_refresh.user))

            res = Response({"message": "Token refreshed", "access": new_access}, status=status.HTTP_200_OK)
            # Access token cookie (15 minutes)
            res.set_cookie(
                key="access_token",
                value=new_access,
                httponly=True,
                secure=False,
                samesite="Lax" ,
                max_age=15 * 60,
                path="/"
            )

            # Refresh token cookie (7 days)
            res.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="Lax" ,
                max_age=7 * 24 * 3600,
                path="/"
            )
            csrf.get_token(request)
            return res
        except Exception as e:
            print("Refresh error:", e)  # <-- Now 'e' is defined!
            return Response({'detail': 'Invalid refresh token', 'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            data = response.data
            refresh = data["refresh"]
            access = data["access"]

            res = Response(status=status.HTTP_200_OK)
            res.set_cookie(
                key="access_token",
                value=access,
                httponly=True,
                secure=False,  # only sent over HTTPS
                samesite="Lax",  # adjust for your frontend/backend domain setup
            )
            res.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=False,
                samesite="Lax",
            )
            res.data = {"message": "Login successful"}
            return res
        return response



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

    def get_employee_attendance(employee_id):
        today = timezone.now().date()

    # Check if today is a holiday
        if PublicHoliday.objects.filter(date=today).exists():
            return 'holiday'

    # Check if already marked attendance
        if Attendance.objects.filter(employee_id=employee_id, date=today).exists():
            return Attendance.objects.get(employee_id=employee_id, date=today).status

    # If not marked and not a holiday, mark as absent
        return 'absent'
    
class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all().order_by('-date')
    serializer_class = MeetingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Meeting.objects.all().order_by('-date')

    

class IsAdminOrTeamManager(permissions.BasePermission):
    
    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Admin always allowed
        if user.is_staff:
            return True

        # Check if user has employee profile and role = 'team_manager'
        if hasattr(user, 'employee') and user.employee.roles == 'team_manager':
            return True

        return False

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
    
class LeaveRequestViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveRequestSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee']
    search_fields = ['reason', 'leave_type']
    ordering_fields = ['start_date', 'created_at']
    pagination_class = LeaveRequestPagination

    def get_queryset(self):
        user = self.request.user
        qs = LeaveRequests.objects.select_related('employee')

        if not user.is_authenticated:
            return LeaveRequests.objects.none()

    # ✅ If team lead or team manager — return all requests
        if hasattr(user, 'employee'):
            position = user.employee.roles
            if position in ['team_lead', 'team_manager']:
                return qs.all()  # Show all requests to approvers

        # ✅ Regular employees — show only own requests
            return qs.filter(employee=user.employee)

        return qs.none()


    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'employee'):
            serializer.save(employee=user.employee)
        else:
            raise PermissionDenied("User is not associated with an employee.")

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        status_value = request.data.get('status')
        if status_value not in ['approved', 'denied']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        instance.status = status_value
        instance.save()
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['get'], url_path='employee/(?P<employee_id>[^/.]+)')
    def by_employee(self, request, employee_id=None):
        qs = LeaveRequests.objects.filter(employee__id=employee_id)
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
    queryset = Shift.objects.all().order_by('-id')
    serializer_class = ShiftSerializer
    pagination_class = ShiftPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name'] 

    def get_queryset(self):
        query = self.request.query_params.get('search', None)
        qs = super().get_queryset()
        if query:
            return qs.filter(name__icontains=query)
        return qs


class TeamPagination(PageNumberPagination):
    page_size = 10  # or whatever default page size you prefer
    page_size_query_param = 'page_size'
    max_page_size = 1000

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.select_related('head', 'shift').all().order_by('-id')
    serializer_class = TeamSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'head__name', 'shift__name']
    pagination_class = TeamPagination
    
  