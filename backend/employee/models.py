from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
# Create your models here.
class broker(models.Model):
    name = models.CharField(max_length=100, db_index=True)  # if searched
    email = models.EmailField(max_length=100, unique=True, db_index=True)  # already unique
    NMLS = models.CharField(max_length=50, unique=True, db_index=True)  # already unique
    primary_phone = models.CharField(max_length=25, unique=True, db_index=True)  # already unique
    phone = models.CharField(max_length=25, unique=True, db_index=True)  # already unique
    address = models.TextField()
    company_address = models.TextField()
    logo = models.ImageField(upload_to='broker_logos/', blank=True, null=True)
    designation = models.CharField(max_length=100, db_index=True)  # if you search by this

    entregar_email = models.EmailField(max_length=100, blank=True, null=True)
    entregar_fax = models.CharField(max_length=25, blank=True, null=True)
    entregar_phone = models.CharField(max_length=25, blank=True, null=True)
    signature = models.ImageField(upload_to='broker_signatures/', blank=True, null=True)
    doc_order_option = models.CharField(max_length=255, blank=True, null=True)
    submission_checklist = models.TextField(blank=True, null=True)  # Optional: can be FileField or JSONField

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

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    last_updated = models.DateTimeField(auto_now=True, db_index=True)
    def __str__(self):
        return f"{self.name} ({self.broker_company.name})"



class Employee(models.Model):
    POSITION_CHOICES = [
        ('junior_processor', 'Junior Processor'),
        ('processor', 'Processor'),
        ('team_lead', 'Team Lead'),
        ('team_manager', 'Team Manager'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
    ]

    # Identity fields
    login_id = models.CharField(max_length=50, unique=True, db_index=True, null=True, blank=True)
    name = models.CharField(max_length=100, db_index=True)
    company_email = models.EmailField(unique=True, db_index=True, default='default@example.com')
    contact_number = models.CharField(max_length=20, blank=True, db_index=True)
    

    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default='junior_processor', db_index=True)

    # Removed manager, type, is_active fields here

    performance_score = models.FloatField(default=0.0, db_index=True)
    experience_months = models.PositiveIntegerField(default=0, db_index=True)

    # Banking
    bank_name = models.CharField(max_length=100, blank=True, db_index=True)
    account_number = models.CharField(max_length=50, blank=True, db_index=True)
    bank_details = models.TextField(blank=True, db_index=True)

    # Employment
    address = models.TextField(blank=True, db_index=True)
    date_of_join = models.DateField(null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_index=True)
    login_password = models.CharField(max_length=128, blank=True, null=True, db_index=True)
    leave_balance = models.FloatField(default=0.0, db_index=True)

    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    def __str__(self):
        return self.name


class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=[('present', 'Present'), ('absent', 'Absent')])

    class Meta:
        unique_together = ('employee', 'date')  # Prevent duplicates

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
