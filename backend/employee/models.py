# employee/models.py
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from userauth.models import Role, Permission
from django.conf import settings
from django.contrib.auth.models import Group
from zoneinfo import ZoneInfo
import pytz
from datetime import datetime, timedelta, time
from employee.utils import now_cst, CST, to_cst, get_cst_date
from django.db.models import Sum
from decimal import Decimal


# Create your models here.
class Broker(models.Model):
    name = models.CharField(max_length=100, db_index=True)  # if searched
    email = models.EmailField(max_length=100, unique=True, db_index=True)  # already unique
    NMLS = models.CharField(max_length=50, unique=True, db_index=True)  # already unique
    primary_phone = models.CharField(max_length=25, unique=True, db_index=True)  # already unique
    phone = models.CharField(max_length=25, db_index=True, blank=True, null=True)  # already unique
    address = models.TextField(blank=True, null=True)
    company_address = models.TextField(blank=True, null=True)

    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        permissions = [
        
            ("sidebar_broker", "Can view in sidebar"),
        ]

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
    
    class Meta:
        permissions = [
        
            ("sidebar_loanofficer", "Can view in sidebar"),
        ]

    def __str__(self):
        return f"{self.name} ({self.broker_company.name})"



class Employee(models.Model):
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
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    bank_account_no = models.CharField(max_length=50, null=True, blank=True, db_index=True)
    work_location = models.CharField(max_length=150, null=True, blank=True)
    base_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Monthly gross salary before incentives and deductions.",
    )
    hra = models.DecimalField("House Rent Allowance", max_digits=10, decimal_places=2, default=0)
    conveyance_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medical_reimbursement = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    uniform_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    food_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    arrear_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    # --- Statutory / Compliance ---
    uan_number = models.CharField(max_length=12, unique=True, null=True, blank=True, db_index=True)
    tds_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    labour_welfare_fund = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    # --- Variable Earnings ---
    bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    leave_encashment_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    overtime_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    night_shift_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    comp_off_balance = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))

    # --- Deductions ---
    loan_repayment_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    login_password = models.CharField(max_length=128, blank=True, null=True, db_index=True)

    yearly_paid_leaves = models.IntegerField(default=12)   # yearly quota
    leave_balance = models.IntegerField(default=12)  

    def save(self, *args, **kwargs):
        # Ensure balance never exceeds yearly quota
        if self.leave_balance > self.yearly_paid_leaves:
            self.leave_balance = self.yearly_paid_leaves

        # only update linked user if it exists
        if self.login_id and self.user:
            self.user.username = self.login_id
            self.user.save(update_fields=["username"])
        super().save(*args, **kwargs)

    def prorated_salary(self, payable_days: int, period_working_days: int) -> Decimal:
        if not self.base_salary or period_working_days <= 0:
            return Decimal("0.00")
        day_rate = (self.base_salary / Decimal(period_working_days)).quantize(Decimal("0.01"))
        return (day_rate * Decimal(payable_days)).quantize(Decimal("0.01"))

    
    @property
    def total_monthly_salary(self):
        return (
            self.base_salary +
            self.hra +
            self.conveyance_allowance +
            self.medical_reimbursement +
            self.uniform_allowance +
            self.food_allowance +
            self.special_allowance +
            self.arrear_salary
        )   
    class Meta:
        permissions = [
           
            ("sidebar_employee", "Can view in sidebar"),
        ]

    def __str__(self):
        return f"{self.name} ({self.login_id})"
    
    def reset_leave_balance_if_needed(self):
        """Reset leave balance every January 1st."""
        today = get_cst_date().date()
        if today.month == 1 and today.day == 1:
            self.leave_balance = self.yearly_paid_leaves
            self.save(update_fields=["leave_balance"])

    def get_yearly_late_minutes(self, year=None):
        from .models import Attendance
        if year is None:
            year = timezone.now().year
        result = self.attendances.filter(
            date__year=year,
            status=Attendance.STATUS_LATE
        ).aggregate(total_late=Sum('minutes_late'))
        return result['total_late'] or 0
    
class PublicHoliday(models.Model):
    date = models.DateField(unique=True)
    title = models.CharField(max_length=100)
    is_public = models.BooleanField(default=False, help_text="True if imported from official public holiday calendar")
    source = models.CharField(max_length=50, blank=True, null=True, help_text="e.g. 'python-holidays:US-IL' or 'manual'")

    class Meta:
        ordering = ("date",)
        indexes = [
            models.Index(fields=["date"]),
        ]

    def __str__(self):
        return f"{self.title} on {self.date}"

class Meeting(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    datetime = models.DateTimeField(null=True, blank=True)  # store combined date + time
    employees = models.ManyToManyField('Employee', related_name='meetings')

    def __str__(self):
        dt_cst = to_cst(self.datetime) if self.datetime else None
        return f"{self.title} - {dt_cst.strftime('%Y-%m-%d %H:%M') if dt_cst else 'No time set'}"

class LeaveRequests(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=50)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=[('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')], default='pending')
    created_at = models.DateTimeField(default=now_cst, editable=False)
    
    approval_type = models.CharField(  # <- New
        max_length=20,
        choices=[('paid', 'Paid'), ('unpaid', 'Unpaid')],
        null=True,
        blank=True
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        related_name='approved_leaves',
        on_delete=models.SET_NULL
    )
    denied_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        related_name='denied_leaves',
        on_delete=models.SET_NULL
    )
    processed_at = models.DateTimeField(null=True, blank=True) 

    
    def save(self, *args, **kwargs):
    # Get previous state only when updating existing instance
        previous = LeaveRequests.objects.get(pk=self.pk) if self.pk else None

        super().save(*args, **kwargs)  # Save first

        # If new record → no action
        if not previous:
            return

        # If neither status nor approval_type changed → skip to avoid double updates
        if previous.status == self.status and previous.approval_type == self.approval_type:
            return

        self.apply_impact_on_employee(previous)
        self.apply_attendance_status_updates(previous)

    @property
    def total_days(self):
        # e.g. 1-day leave still counts as "1"
        return (self.end_date - self.start_date).days + 1

    def apply_attendance_status_updates(self, previous):
        employee = self.employee
        date_range = [self.start_date, self.end_date]

        # APPROVED + PAID → mark as paid leave
        if self.status == "approved" and self.approval_type == "paid":
            Attendance.objects.filter(
                employee=employee,
                date__range=date_range
            ).update(status=Attendance.STATUS_ON_LEAVE)
            return

        # APPROVED + UNPAID → mark as unpaid leave
        if self.status == "approved" and self.approval_type == "unpaid":
            Attendance.objects.filter(
                employee=employee,
                date__range=date_range
            ).update(status=Attendance.STATUS_UNPAID_LEAVE)
            return

        # 🚩 APPROVED → DENIED (Revert to ABSENT)
        if previous.status == "approved" and self.status == "denied":
            Attendance.objects.filter(
                employee=employee,
                date__range=date_range
            ).update(status=Attendance.STATUS_ABSENT)
            return
        
        if previous.status == "denied" and self.status == "pending":
            Attendance.objects.filter(
                employee=employee,
                date__range=date_range
            ).update(status="")  # empty status, calendar logic will decide
            return
    
        # 🚩 APPROVED → PENDING (Revert to blank → no response yet)
        if previous.status == "approved" and self.status == "pending":
            Attendance.objects.filter(
                employee=employee,
                date__range=date_range
            ).update(status="")  # blank state on frontend
            return

    def apply_impact_on_employee(self, previous):
        employee = self.employee
        days = self.total_days

        # 1️⃣ Approving a PAID leave → deduct ONCE
        if self.status == "approved" and self.approval_type == "paid":
            # Deduct only if it wasn't already deducted before
            if not (previous.status == "approved" and previous.approval_type == "paid"):
                employee.leave_balance = employee.leave_balance - days
                employee.save(update_fields=["leave_balance"])
            return

        # 2️⃣ Reverting an approved paid leave → restore balance back
        if previous.status == "approved" and previous.approval_type == "paid" and self.status in ["pending", "denied"]:
            employee.leave_balance = min(employee.yearly_paid_leaves, employee.leave_balance + days)
            employee.save(update_fields=["leave_balance"])
            print("IMPACT RUNNING →", self.status, self.approval_type)
            return

        # 3️⃣ unpaid leave or no change → do nothing


    class Meta:
        permissions = [
            ("approve_leave", "Can approve leave requests"),
            ("deny_leave", "Can deny leave requests"),
        ]

    def __str__(self):
         return f"{self.employee} - {self.approval_type or 'N/A'} ({self.status})"


class Shift(models.Model):
    name = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    total_hours = models.CharField(max_length=10)
    grace_period_minutes = models.PositiveIntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)  # Automatically set when created
    updated_at = models.DateTimeField(auto_now=True) 
    
    def __str__(self):
        return self.name

    def get_span_for_date(self, date, tz=ZoneInfo("America/Chicago")):

        start_dt = datetime.combine(date, self.start_time).replace(tzinfo=tz)
        end_dt = datetime.combine(date, self.end_time).replace(tzinfo=tz)
        if end_dt <= start_dt:
            end_dt = end_dt + timedelta(days=1)
        return start_dt, end_dt
    
class Team(models.Model):
    name = models.CharField(max_length=100)
    head = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, related_name='headed_teams')
    manager = models.ForeignKey('Employee', on_delete=models.SET_NULL, null=True, related_name='managed_teams')
    shift = models.ForeignKey('Shift', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Automatically set when created
    updated_at = models.DateTimeField(auto_now=True) 

    
    def __str__(self):
        return self.name

class Attendance(models.Model):
    STATUS_EARLY = "EARLY"
    STATUS_PRESENT = "PRESENT"
    STATUS_LATE = "LATE"
    STATUS_ABSENT = "ABSENT"
    STATUS_ON_LEAVE = "ON_LEAVE"
    STATUS_UNPAID_LEAVE = "UNPAID_LEAVE"

    STATUS_CHOICES = [
        (STATUS_EARLY, "Early"),
        (STATUS_PRESENT, "Present"),
        (STATUS_LATE, "Late"),
        (STATUS_ABSENT, "Absent"),
        (STATUS_ON_LEAVE, "On Leave (Paid)"),
        (STATUS_UNPAID_LEAVE, "Unpaid Leave"),
    ]

    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField(db_index=True)  # the shift-start date in America/Chicago
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)
    login_time = models.DateTimeField(null=True, blank=True)  # actual login datetime in America/Chicago
    logout_time = models.DateTimeField(null=True, blank=True)
    counted_from = models.DateTimeField(null=True, blank=True)  # the datetime when worked-time starts counting
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    minutes_late = models.IntegerField(null=True, blank=True)
    worked_minutes = models.IntegerField(null=True, blank=True)
    total_break_minutes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        permissions = [
            ("view_latelogins", "Can view Login records"),
        ]
        unique_together = ("employee", "date")
        ordering = ("-date",)

    def recalc_worked_minutes(self, logout_dt=None):
        """Recalculate worked minutes considering breaks."""
        if logout_dt is None:
            logout_dt = self.logout_time or timezone.now()

        # work duration from counted_from → logout
        work_duration = (logout_dt - self.counted_from).total_seconds() // 60

        # subtract all breaks
        break_minutes = sum(b.duration_minutes for b in self.breaks.all())
        self.total_break_minutes = break_minutes

        self.worked_minutes = max(0, int(work_duration - break_minutes))
        self.save(update_fields=["worked_minutes", "total_break_minutes", "updated_at"])

    def calculate_effective_work_seconds(self):
        """
        Calculate total worked seconds for this attendance record,
        considering shift timings, multiple login/logout logs, and breaks.
        """
        if not self.shift:
            return 0  # no shift info, cannot calculate accurately

        total_seconds = 0
        shift_start = timezone.make_aware(
            datetime.combine(self.date, self.shift.start_time),
            timezone=pytz.timezone("America/Chicago")
        )
        shift_end = timezone.make_aware(
            datetime.combine(self.date, self.shift.end_time),
            timezone=pytz.timezone("America/Chicago")
        )

        for log in self.logs.all():
            login = to_cst(log.login_time)
            logout = to_cst(log.logout_time) if log.logout_time else to_cst(timezone.now())

            # constrain within shift boundaries
            effective_start = max(login, shift_start)
            effective_end = min(logout, shift_end)

            if effective_end > effective_start:
                total_seconds += (effective_end - effective_start).total_seconds()

        # subtract total breaks for this day
        total_break_seconds = sum(b.duration_minutes * 60 for b in self.breaks.all())
        total_seconds = max(0, total_seconds - total_break_seconds)

        return total_seconds

    def __str__(self):
        return f"{self.employee} - {self.date} - {self.status}"

class AttendanceLog(models.Model):
    attendance = models.ForeignKey(
        Attendance, on_delete=models.CASCADE, related_name="logs"
    )
    login_time = models.DateTimeField()
    logout_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["login_time"]

    def worked_minutes(self):
        """Calculate duration in minutes for this log."""
        if self.logout_time:
            return int((self.logout_time - self.login_time).total_seconds() // 60)
        return 0

    def __str__(self):
        return f"{self.attendance.employee} | {self.login_time.strftime('%Y-%m-%d %H:%M')} → {self.logout_time.strftime('%H:%M') if self.logout_time else '...'}"


class Break(models.Model):
    attendance = models.ForeignKey("Attendance", on_delete=models.CASCADE, related_name="breaks")
    break_in = models.DateTimeField(default=now_cst)
    break_out = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.PositiveIntegerField(default=0)

    def close_break(self, breakout_dt=None):
        if not breakout_dt:
            breakout_dt = timezone.now()
        self.break_out = breakout_dt
        delta = breakout_dt - self.break_in
        self.duration_minutes = int(delta.total_seconds() // 60)
        self.save(update_fields=["break_out", "duration_minutes"])
        return self.duration_minutes

    def __str__(self):
        return f"Break {self.break_in} - {self.break_out or 'ongoing'}"
    

class Designation(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name


class MonthlyAttendanceSummary(models.Model):
    employee = models.ForeignKey("Employee", on_delete=models.CASCADE, related_name="monthly_summaries")
    year = models.IntegerField()
    month = models.IntegerField()

    early_count = models.PositiveIntegerField(default=0)
    present_count = models.PositiveIntegerField(default=0)
    late_count = models.PositiveIntegerField(default=0)
    absent_count = models.PositiveIntegerField(default=0)
    leave_count = models.PositiveIntegerField(default=0)
    unpaid_leave_count = models.PositiveIntegerField(default=0)
    total_worked_minutes = models.PositiveIntegerField(default=0)  # ✅ NEW field
    total_overtime_minutes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("employee", "year", "month")

    def __str__(self):
        return f"{self.employee} - {self.month}/{self.year}"



class Lender(models.Model):
    lender_name = models.CharField(max_length=255)
    account_executive_name = models.CharField(max_length=255, blank=True, null=True)
    executive_email = models.EmailField(unique=True)
    executive_phone = models.CharField(max_length=20, unique=True)
    executive_address = models.TextField(blank=True, null=True)

    account_manager_name = models.CharField(max_length=255, blank=True, null=True)
    manager_email = models.EmailField(unique=True)
    manager_contact = models.CharField(max_length=20, unique=True)
    manager_address = models.TextField(blank=True, null=True)

    mortgage_clause = models.TextField(blank=True, null=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        permissions = [
            
            ("sidebar_lender", "Can view in sidebar"),
        ]
    
    def __str__(self):
        return self.lender_name
    

class TeamLead(models.Model):
    lead = models.OneToOneField(Employee, on_delete=models.CASCADE, related_name="lead_of")
    members = models.ManyToManyField(Employee, related_name="member_of_teams")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Lead: {self.lead.login_id} ({self.lead.name})"


class TeamManager(models.Model):
    manager = models.OneToOneField(
        Employee, on_delete=models.CASCADE, related_name="managed_team", verbose_name="Team Manager")
    team_leads = models.ManyToManyField(
        'TeamLead', related_name='managers', verbose_name="Team Leads", blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Team Manager"
        verbose_name_plural = "Team Managers"

    def __str__(self):
        return f"{self.manager.login_id} - {self.manager.name}"

    @property
    def members(self):

        members_set = set()
        for lead in self.team_leads.all():
            members_set.update(lead.members.all())
        return members_set
    

class EmployeeToken(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('responded', 'Responded'),
    ]
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tokens')
    title = models.CharField(max_length=255)
    description = models.TextField()
    responder = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, blank=True, null=True, related_name='responded_tokens')
    response = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        permissions = [
            ("view_tokens", "Can view tokens"),
            ("approve_tokens", "Can approve tokens"),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.employee.username}"
    

class EmployeeBreak(models.Model):
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='breaks')
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    reason = models.CharField(max_length=255, blank=True, null=True)
    @property
    def duration_seconds(self):
        """Return break duration in seconds, None if still ongoing"""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None
    

    
