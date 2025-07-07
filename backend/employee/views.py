from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from .models import broker, LoanOfficer, Employee, Attendance, PublicHoliday,Meeting
from rest_framework import viewsets, status, filters, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .serializers import BrokerSerializer, LoanOfficerSerializer, EmployeeSerializer, AttendanceSerializer, PublicHolidaySerializer, MeetingSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import api_view, action
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


# ✅ Custom Pagination (no max page size)
class BrokerPagination(PageNumberPagination):
    page_size = 10  # default
    page_size_query_param = 'page_size'  # allows frontend to override
    max_page_size = 1000  # no max limit

# ✅ Main API ViewSet
class BrokerViewSet(viewsets.ModelViewSet):
    queryset = broker.objects.all()
    serializer_class = BrokerSerializer
    parser_classes = (MultiPartParser, FormParser)
    pagination_class = BrokerPagination

    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'email', 'designation','NMLS']
    ordering_fields = ['name','created_at']
    filterset_fields = ['designation']
    ordering = ['-created_at'] 

    

    def get_queryset(self):
        queryset = broker.objects.all().order_by('-created_at')

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

    def create(self, request, *args, **kwargs):
        print("📦 Received data:", request.data)
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            print("❌ Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            print("❌ Validation errors during update:", serializer.errors)
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
        qs = broker.objects.filter(email=email)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['email'] = 'Email already exists.'

    if phone:
        qs = broker.objects.filter(phone=phone)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['phone'] = 'Phone number already exists.'

    if primary_phone:
        qs = broker.objects.filter(primary_phone=primary_phone)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['primary_phone'] = 'Primary phone already exists.'

    if NMLS:
        qs = broker.objects.filter(NMLS=NMLS)
        if exclude_id:
            qs = qs.exclude(id=exclude_id)
        if qs.exists():
            errors['NMLS'] = 'NMLS number already exists.'

    return Response({'errors': errors})# Add similar checks for phone, primary_phone, NMLS...


@api_view(['GET'])
def broker_stats(request):
    from .models import broker
    from django.utils import timezone
    total = broker.objects.count()
    this_week = broker.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
    last_updated = broker.objects.latest('updated_at').updated_at if broker.objects.exists() else None

    return Response({
        'total': total,
        'this_week': this_week,
        'last_updated': last_updated,
    })


@api_view(['GET'])
def export_brokers_xml(request):
    brokers = broker.objects.all()

    root = ET.Element('Brokers')

    for b in brokers:
        broker_elem = ET.SubElement(root, 'Broker')
        ET.SubElement(broker_elem, 'Name').text = b.name or ''
        ET.SubElement(broker_elem, 'Email').text = b.email or ''
        ET.SubElement(broker_elem, 'NMLS').text = b.NMLS or ''
        ET.SubElement(broker_elem, 'PrimaryPhone').text = b.primary_phone or ''
        ET.SubElement(broker_elem, 'Phone').text = b.phone or ''
        ET.SubElement(broker_elem, 'Address').text = b.address or ''
        ET.SubElement(broker_elem, 'CompanyAddress').text = b.company_address or ''
        ET.SubElement(broker_elem, 'Designation').text = b.designation or ''
        ET.SubElement(broker_elem, 'CreatedAt').text = b.created_at.isoformat() if b.created_at else ''

    xml_str = ET.tostring(root, encoding='utf-8')
    response = HttpResponse(xml_str, content_type='application/xml')
    response['Content-Disposition'] = 'attachment; filename="brokers.xml"'
    return response

def export_brokers_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="brokers.csv"'

    writer = csv.writer(response)
    # Write CSV header
    writer.writerow([
        'Name', 'Email', 'NMLS', 'Primary Phone', 'Phone',
        'Address', 'Company Address', 'Designation', 'Created At'
    ])

    # Write data rows
    for b in broker.objects.all():
        writer.writerow([
            b.name,
            b.email,
            b.NMLS,
            b.primary_phone,
            b.phone,
            b.address,
            b.company_address,
            b.designation,
            b.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        ])

    return response


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

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-date_joined')
    serializer_class = EmployeeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['position', 'status']  # ✅ Removed 'manager'
    search_fields = ['name', 'login_id', 'company_email', 'contact_number']
    ordering_fields = ['date_joined', 'experience_months', 'performance_score', 'name']
    pagination_class = EmployeePagination


@api_view(['GET'])
def export_employees_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="employees.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'ID', 'Login ID', 'Name', 'Company Email', 'Contact Number',
        'Position', 'Status', 'Bank Name', 'Account Number', 'Bank Details',
        'Address', 'Experience Months', 'Performance Score',
        'Date of Join', 'Leave Balance', 'Created At', 'Updated At'
    ])

    for emp in Employee.objects.all():
        writer.writerow([
            emp.id, emp.login_id, emp.name, emp.company_email, emp.contact_number,
            emp.position, emp.status, emp.bank_name, emp.account_number, emp.bank_details,
            emp.address, emp.experience_months, emp.performance_score,
            emp.date_of_join, emp.leave_balance, emp.date_joined, emp.updated_at,
        ])

    return response

@api_view(['GET'])
def export_employees_xml(request):
    root = ET.Element("employees")
    for emp in Employee.objects.all():
        e = ET.SubElement(root, "employee")
        for attr in [
            'id', 'login_id', 'name', 'company_email', 'contact_number',
            'position', 'status', 'bank_name', 'account_number', 'bank_details',
            'address', 'experience_months', 'performance_score',
            'date_of_join', 'leave_balance', 'date_joined', 'updated_at',
        ]:
            child = ET.SubElement(e, attr)
            child.text = str(getattr(emp, attr, ''))

    tree = ET.ElementTree(root)
    response = HttpResponse(content_type='application/xml')
    response['Content-Disposition'] = 'attachment; filename="employees.xml"'
    tree.write(response, encoding='unicode')
    return response


@api_view(['POST'])
def employee_login(request):
    login_id = request.data.get('login_id')
    login_password = request.data.get('login_password')

    if not login_id or not login_password:
        return Response({'error': 'Both login ID and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        employee = Employee.objects.get(login_id=login_id)
        if employee.login_password != login_password:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        today = date.today()

        # ✅ 1. Mark today as present if not already
        Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={'status': 'present'}
        )

        # ✅ 2. Fill missing days in this month as absent (excluding Sundays)
        first_day = today.replace(day=1)
        last_day = today.replace(day=calendar.monthrange(today.year, today.month)[1])
        current = first_day
        while current <= today:
            if current.weekday() != 6:  # Sunday
                Attendance.objects.get_or_create(
                    employee=employee,
                    date=current,
                    defaults={'status': 'absent'}
                )
            current += timedelta(days=1)

        # ✅ 3. Recalculate leave balance
        present_days = Attendance.objects.filter(employee=employee, date__month=today.month, status='present').count()
        total_working_days = sum(1 for d in range(1, last_day.day + 1)
                                 if date(today.year, today.month, d).weekday() != 6)
        leave_balance = total_working_days - present_days
        employee.leave_balance = leave_balance
        employee.save()

        return Response({
            'id': employee.id,
            'login_id': employee.login_id,
            'name': employee.name,
            'position': employee.position,
            'status': employee.status,
            'leave_balance': employee.leave_balance,
        })

    except Employee.DoesNotExist:
        return Response({'error': 'Employee not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def get_employee_attendance(request, employee_id):
    attendances = Attendance.objects.filter(employee_id=employee_id).order_by('date')
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


class PublicHolidayViewSet(viewsets.ModelViewSet):
    queryset = PublicHoliday.objects.all().order_by('date') 
    serializer_class = PublicHolidaySerializer



class MeetingViewSet(viewsets.ModelViewSet):
    queryset = Meeting.objects.all().order_by('-date')
    serializer_class = MeetingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Meeting.objects.all().order_by('-date')

    

# class IsAdminOrTeamManager(permissions.BasePermission):
    
#     def has_permission(self, request, view):
#         user = request.user
#         if not user or not user.is_authenticated:
#             return False

#         # Admin always allowed
#         if user.is_staff:
#             return True

#         # Check if user has employee profile and role = 'team_manager'
#         if hasattr(user, 'employee') and user.employee.position == 'team_manager':
#             return True

#         return False