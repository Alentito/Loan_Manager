from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.auth.models import Group
from employee.models import Employee
from loan.models import Milestone
from decimal import Decimal
from solo.models import SingletonModel


class IncentiveRule(models.Model):
    """Defines incentive tiers based on role, milestone, and file count."""
    roles = models.ManyToManyField(Group, blank=True, related_name='incentive_rules')
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='incentive_rules',
        help_text="Specific milestone to count, or null for all payroll-eligible"
    )
    min_files = models.IntegerField(validators=[MinValueValidator(0)])
    max_files = models.IntegerField(
        null=True,
        blank=True,
        help_text="Null means 'and above'"
    )
    amount_per_file = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(
        default=0,
        help_text="Higher priority rules apply first (for overlapping ranges)"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', 'min_files']
        indexes = [
            models.Index(fields=['is_active', 'priority']),
        ]

    def __str__(self):
        parts = []
        if self.milestone_id:
            parts.append(self.milestone.name)
        roles_cnt = self.roles.count()
        if roles_cnt:
            parts.append(f"{roles_cnt} role(s)")
        range_txt = f"{self.min_files}-{self.max_files or '∞'}"
        base = " | ".join(parts) if parts else "Incentive"
        return f"{base} [{range_txt}]"

    def applies_to_employee(self, employee: Employee) -> bool:
        """Check if this rule applies to the given employee's roles."""
        if not self.roles.exists():
            return True  # Universal rule
        employee_groups = set(employee.roles.values_list('id', flat=True))
        rule_groups = set(self.roles.values_list('id', flat=True))
        return bool(employee_groups & rule_groups)

    def calculate_amount(self, file_count: int) -> Decimal:
        """Calculate incentive for given file count."""
        if file_count < self.min_files:
            return Decimal('0.00')
        if self.max_files and file_count > self.max_files:
            return Decimal('0.00')
        
        eligible_files = file_count
        if self.max_files:
            eligible_files = min(file_count, self.max_files) - self.min_files + 1
        else:
            eligible_files = file_count - self.min_files + 1
            
        return (Decimal(str(eligible_files)) * self.amount_per_file).quantize(Decimal('0.01'))


class PayrollSettings(SingletonModel):
    """Global payroll computation settings (singleton)."""
    
    # PF (Provident Fund)
    pf_employee_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('12.00'),
        help_text="Employee PF contribution %"
    )
    pf_employer_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('3.67'),
        help_text="Employer PF contribution %"
    )
    eps_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('8.33'),
        help_text="EPS contribution %"
    )
    
    # ESI (Employee State Insurance)
    esi_employee_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('0.75'),
        help_text="Employee ESI contribution %"
    )
    esi_employer_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('3.25'),
        help_text="Employer ESI contribution %"
    )
    
    # Working days configuration
    standard_working_days = models.IntegerField(
        default=26,
        help_text="Standard working days per month for proration"
    )
    
    # Salary components
    hra_percent = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('40.00'),
        help_text="HRA as % of basic salary"
    )
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Payroll Settings"

    def __str__(self):
        return "Payroll Settings"

    @property
    def pf_employee_rate(self):
        return self.pf_employee_percent / Decimal('100')

    @property
    def pf_employer_rate(self):
        return self.pf_employer_percent / Decimal('100')

    @property
    def eps_rate(self):
        return self.eps_percent / Decimal('100')

    @property
    def esi_employee_rate(self):
        return self.esi_employee_percent / Decimal('100')

    @property
    def esi_employer_rate(self):
        return self.esi_employer_percent / Decimal('100')

    @property
    def hra_rate(self):
        return self.hra_percent / Decimal('100')


class EmployeePayroll(models.Model):
    """Monthly payroll record for an employee."""
    
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='payrolls'
    )
    month = models.DateField(help_text="First day of the payroll month")
    
    # Salary components
    base_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Monthly base salary"
    )
    hra = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    other_allowances = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Attendance adjustments
    working_days = models.IntegerField(default=26)
    present_days = models.IntegerField(default=0)
    paid_leave_days = models.IntegerField(default=0)
    unpaid_leave_days = models.IntegerField(default=0)
    payable_days = models.IntegerField(default=0)
    
    # Prorated base
    prorated_base = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Incentives
    loan_count = models.IntegerField(default=0)
    incentive_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    incentive_breakdown = models.JSONField(
        default=dict,
        blank=True,
        help_text="Detail of incentive calculations"
    )
    
    # Gross
    gross_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total before deductions"
    )
    
    # Statutory deductions
    pf_employee_contribution = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    pf_employer_contribution = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    eps_contribution = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    esi_employee_contribution = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    esi_employer_contribution = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    
    # Other deductions
    other_deductions = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Loans, advances, etc."
    )
    
    total_deductions = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    
    # Net
    net_salary = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('approved', 'Approved'),
            ('paid', 'Paid'),
            ('cancelled', 'Cancelled'),
        ],
        default='draft'
    )
    
    notes = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_payrolls'
    )
    approved_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_payrolls'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'month')
        ordering = ['-month', 'employee__name']
        indexes = [
            models.Index(fields=['month', 'status']),
            models.Index(fields=['employee', 'month']),
        ]
        permissions = [
            ('approve_payroll', 'Can approve payroll'),
            ('view_all_payrolls', 'Can view all employee payrolls'),
        ]

    def __str__(self):
        return f"{self.employee.name} - {self.month.strftime('%B %Y')}"


class PayrollAuditLog(models.Model):
    """Track all payroll modifications for compliance."""
    
    payroll = models.ForeignKey(
        EmployeePayroll,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    action = models.CharField(
        max_length=50,
        choices=[
            ('created', 'Created'),
            ('updated', 'Updated'),
            ('approved', 'Approved'),
            ('paid', 'Paid'),
            ('cancelled', 'Cancelled'),
        ]
    )
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    changes = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} - {self.payroll} by {self.user}"