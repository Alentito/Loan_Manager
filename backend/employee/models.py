from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from userauth.models import Role, Permission
from django.conf import settings
from django.contrib.auth.models import Group


# Create your models here.
class Broker(models.Model):
    name = models.CharField(max_length=100, db_index=True)  # if searched
    email = models.EmailField(max_length=100, unique=True, db_index=True)  # already unique
    NMLS = models.CharField(max_length=50, unique=True, db_index=True)  # already unique
    primary_phone = models.CharField(max_length=25, unique=True, db_index=True)  # already unique
    phone = models.CharField(max_length=25, unique=True, db_index=True)  # already unique
    address = models.TextField()
    company_address = models.TextField()
     
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    def __str__(self):
        return self.name
    


class LoanOfficer(models.Model):
    name = models.CharField(max_length=100, db_index=True)
    contact_number = models.CharField(max_length=25, unique=True, db_index=True)
    email = models.EmailField(max_length=100, unique=True, db_index=True)
    NMLS = models.CharField(max_length=50, unique=True, db_index=True)
    broker_company = models.ForeignKey('broker', on_delete=models.CASCADE, related_name='loan_officers')
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    last_updated = models.DateTimeField(auto_now=True, db_index=True)
    
    def __str__(self):
        return f"{self.name} ({self.broker_company.name})"


class Employee(models.Model):
   
    # Identity fields
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    roles = models.ManyToManyField(Group, blank=True)   # allow multiple roles
    login_id = models.CharField(max_length=50, unique=True, db_index=True, null=True, blank=True)
    name = models.CharField(max_length=100, db_index=True)
    company_email = models.EmailField(unique=True, db_index=True, default='default@example.com')
    contact_number = models.CharField(max_length=20, blank=True, db_index=True)
    designation = models.ForeignKey('Designation', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')

    team = models.ForeignKey('Team', on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    primary_shift = models.ForeignKey('Shift', on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_employees')
    alternate_shift = models.ForeignKey('Shift', on_delete=models.SET_NULL, null=True, blank=True, related_name='alternate_employees')

    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    
    
    login_password = models.CharField(max_length=128, blank=True, null=True, db_index=True)


    def __str__(self):
        return self.name


class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('late', 'Late'),
        ('absent', 'Absent'),
        ('paid_leave', 'Paid Leave'),
    ]

    employee = models.ForeignKey('Employee', on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    login_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)

    def __str__(self):
        return f"{self.employee.name} - {self.date} ({self.status})"
    
    
class PublicHoliday(models.Model):
    date = models.DateField(unique=True)
    title = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.title} on {self.date}"


class Meeting(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date = models.DateField()
    time = models.TimeField()
    employees = models.ManyToManyField('Employee', related_name='meetings')

    def __str__(self):
        return f"{self.title} - {self.date}"


class LeaveRequests(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

# models.py (inside employees app)
class Shift(models.Model):
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    total_hours = models.CharField(max_length=10)
    created_at = models.DateTimeField(auto_now_add=True)  # Automatically set when created
    updated_at = models.DateTimeField(auto_now=True) 
    
    def __str__(self):
        return self.name

class Team(models.Model):
    name = models.CharField(max_length=100)
    head = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, related_name='headed_teams')
    shift = models.ForeignKey('Shift', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Automatically set when created
    updated_at = models.DateTimeField(auto_now=True) 

    
    def __str__(self):
        return self.name


class Designation(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name
