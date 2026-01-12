from django.db import models
from django.contrib.auth import get_user_model
from employee.models import Employee, Broker,LoanOfficer


User = get_user_model()

# models/events.py
import uuid
from django.db import models

from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

# ...existing models...

class Milestone(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('archived', 'Archived'),
    ]
    
    name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Name of the milestone (e.g., Application, Underwriting)"
    )
    description = models.TextField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Optional description of this milestone"
    )
    
    # Color fields with hex validation
    color = models.CharField(
        max_length=7,
        default='#2563EB',
        validators=[
            RegexValidator(
                regex='^#[0-9A-Fa-f]{6}$',
                message='Color must be a valid hex code (e.g., #FF0000)'
            )
        ],
        help_text="Text color in hex format"
    )
    background_color = models.CharField(
        max_length=7,
        default='#EEF2FF',
        validators=[
            RegexValidator(
                regex='^#[0-9A-Fa-f]{6}$',
                message='Background color must be a valid hex code (e.g., #FF0000)'
            )
        ],
        help_text="Background color in hex format"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        help_text="Current status of this milestone"
    )
    
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Order in which milestones appear (lower numbers first)"
    )
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_milestones'
    )
    updated_by = models.ForeignKey(
        get_user_model(),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='updated_milestones'
    )
    notify_on_reach = models.BooleanField(
        default=False,
        help_text="Send an email when a loan moves into this milestone",
    )

    include_in_reports = models.BooleanField(
        default=False,
        help_text="Flag this milestone for reporting dashboards",
    )
    include_in_payroll = models.BooleanField(
        default=False,
        help_text="Expose this milestone in payroll calculations",
    )

    class Meta:
        ordering = ['sort_order', 'name']
        # Remove the custom permissions - Django auto-creates these:
        # - loan.add_milestone
        # - loan.change_milestone  
        # - loan.delete_milestone
        # - loan.view_milestone
    
    def __str__(self):
        return self.name
    
    @property
    def is_active(self):
        return self.status == 'active'

class EventOutbox(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    aggregate = models.CharField(max_length=40)          # "loan","task"
    aggregate_id = models.UUIDField(null=True, blank=True)
    event_type = models.CharField(max_length=60)
    payload = models.JSONField()
    tenant_id = models.CharField(max_length=60)
    occurred_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)
    publish_try = models.IntegerField(default=0)
    version = models.IntegerField(default=1)

    

# models/notifications.py
class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey("auth.User", on_delete=models.CASCADE)
    tenant_id = models.CharField(max_length=60)
    type = models.CharField(max_length=60)
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    entity_type = models.CharField(max_length=40, blank=True)
    entity_id = models.UUIDField(null=True, blank=True)
    severity = models.CharField(max_length=20, blank=True)  # info|warning|critical
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    



# models.py
class XMLUpload(models.Model):
    file = models.FileField(upload_to='xml_uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    error_message = models.TextField(blank=True, null=True)

class TaskStatus(models.TextChoices):
    TODO        = "To Do",        "To Do"
    IN_PROGRESS = "In Progress",  "In Progress"
    DONE        = "Done",         "Done"

  
DOC_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('ordered', 'Ordered'),
    ('received', 'Received'),
    ('n/a', 'N/A'),
]

class LoanDocStatus(models.Model):
    loan = models.OneToOneField("Loan", on_delete=models.CASCADE, related_name="doc_status")
    
    title = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    appraisal = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    voe = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    hoi = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    survey = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    credit_card = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    fha_case = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    flood_cert = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    condo_docs = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    pay_off = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    final_inspection = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')
    subordination = models.CharField(max_length=10, choices=DOC_STATUS_CHOICES, default='n/a')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
class DocOrder(models.Model):
    loan = models.ForeignKey('Loan', on_delete=models.CASCADE, related_name='doc_orders')
    appraisal_reimbursed = models.CharField(max_length=255, blank=True)
    ctc_date = models.CharField(max_length=255, blank=True)
    escrow_contact_name = models.CharField(max_length=255, blank=True)
    escrow_phone = models.CharField(max_length=255, blank=True)
    lender_credit = models.CharField(max_length=255, blank=True)
    loan_officer = models.CharField(max_length=255, blank=True)
    property_address = models.CharField(max_length=255, blank=True)
    rate_lock_expiration = models.CharField(max_length=255, blank=True)
    subordination = models.CharField(max_length=255, blank=True)
    investor = models.CharField(max_length=255, blank=True)
    borrower_file_number = models.CharField(max_length=255, blank=True)
    citi_login_and_password = models.CharField(max_length=255, blank=True)
    escrow_email = models.CharField(max_length=255, blank=True)
    impounds = models.CharField(max_length=255, blank=True)
    lender_fees = models.CharField(max_length=255, blank=True)
    loan_amount = models.CharField(max_length=255, blank=True)
    loan_program = models.CharField(max_length=255, blank=True)
    purchase_or_refinance = models.CharField(max_length=255, blank=True)
    rate = models.CharField(max_length=255, blank=True)
    melp_m_or_bpm = models.CharField(max_length=255, blank=True)
    second_lender = models.CharField(max_length=255, blank=True)
    doc_request_date = models.CharField(max_length=255, blank=True)
    property_type = models.CharField(max_length=255, blank=True)
    cd_signed_date = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"DocOrder for Loan {self.loan_id}"
    
class LoanContact(models.Model):
    loan = models.ForeignKey('Loan', on_delete=models.CASCADE, related_name='contacts')
    document_name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True)
    contact = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    fax = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.document_name} ({self.contact})"
    
class ChecklistQuestion(models.Model):
    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.text
    
class LoanChecklistAnswer(models.Model):
    loan = models.ForeignKey('Loan', on_delete=models.CASCADE, related_name="checklist_answers")
    question = models.ForeignKey(ChecklistQuestion, on_delete=models.CASCADE)
    answer = models.BooleanField(default=False)
    comment = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("loan", "question")

    def __str__(self):
        return f"Loan {self.loan_id} - Q{self.question.order}: {'✔️' if self.answer else '❌'}"

# Create your models here.


class LoanRoleAssignment(models.Model):
    loan = models.ForeignKey('Loan', on_delete=models.CASCADE, related_name='role_assignments')
    role = models.ForeignKey('auth.Group', on_delete=models.CASCADE)
    employees = models.ManyToManyField('employee.Employee', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    # Optionally: single employee per role? Use ForeignKey instead of ManyToManyField
    class Meta:
        unique_together = ('loan', 'role')
        verbose_name = 'Loan Role Assignment'
        verbose_name_plural = 'Loan Role Assignments'


class Loan(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100,default="Unknown")

    broker = models.ForeignKey(Broker, on_delete=models.SET_NULL, null=True)
    loan_officer = models.ForeignKey(LoanOfficer, on_delete=models.SET_NULL, null=True, related_name='loans_officer')

    milestone = models.ForeignKey(Milestone, null=True, blank=True, on_delete=models.SET_NULL)

    compensation = models.CharField(max_length=100, blank=True, null=True)

    # Structured compensation (UI: two independent options + amounts)
    compensation_borrower_paid = models.BooleanField(default=False)
    compensation_borrower_paid_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    compensation_lender_paid = models.BooleanField(default=False)
    compensation_lender_paid_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    # Funded milestone options (UI only when milestone is Funded)
    funded_check_to_company = models.BooleanField(default=False)
    funded_check_to_company_note = models.CharField(max_length=200, blank=True, null=True)

    funded_invoice = models.BooleanField(default=False)
    funded_invoice_company = models.CharField(
        max_length=20,
        choices=[("entegra", "Entegra"), ("quantegra", "Quantegra")],
        blank=True,
        null=True,
    )
    funded_invoice_entegra_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    funded_invoice_quantegra_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )

    lock_status = models.CharField(max_length=100, blank=True, null=True)
    lock_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    closing_date = models.DateField(blank=True, null=True)
    point_file = models.CharField(max_length=255, blank=True, null=True)
    subject_property = models.CharField(max_length=255, blank=True, null=True)
    loan_comment = models.TextField(blank=True, null=True)

    lenders = models.ManyToManyField('employee.Lender', related_name='loans', blank=True)

    # team_leader = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_team_leader')
    # team_manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_team_manager')
    # processor = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_processor')
    # support = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_support')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    external_id = models.CharField(
    "Import ID", max_length=40,
    unique=True, null=True, blank=True,
    help_text="MISMO LoanIdentifier (for XML‐imported loans)"
   )
    raw_xml       = models.TextField(
        null=True, blank=True,
        help_text="Stored XML payload (for auditing or re‐parsing)"
    )
    imported_at   = models.DateTimeField(
        null=True, blank=True,
        help_text="Timestamp when this loan was last imported"
    )
    import_source = models.CharField(
        max_length=10,
        choices=[("manual","Manual"), ("xml","XML")],
        default="manual",
        help_text="Whether record was created by user or XML"
    )
    is_archived = models.BooleanField(default=False)  # ➕ add flag

    purpose      = models.CharField(max_length=50, null=True, blank=True)
    note_amount  = models.DecimalField(max_digits=12, decimal_places=2,
                                   null=True, blank=True)
    note_rate    = models.DecimalField(max_digits=6, decimal_places=3,
                                   null=True, blank=True)

    class Meta:
     permissions = [
        ("view_all_loans", "Can view all loans"),
        ("View_reports", "Can view reports"),
     ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.subject_property or 'Loan'}"
    


class Task(models.Model):
    loan       = models.ForeignKey(Loan, related_name="tasks",
                                   on_delete=models.CASCADE, null=True, blank=True)
    title      = models.CharField(max_length=160)
    assignee = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tasks")
    assigner = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_tasks")
    description= models.TextField(blank=True)
    status     = models.CharField(max_length=20,
                                  choices=TaskStatus.choices,
                                  default=TaskStatus.TODO)
    position   = models.PositiveIntegerField(default=0)      # order in column
    
    tags       = models.JSONField(default=list, blank=True)  # ["Bug", "Story"]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["status", "position", "-updated_at"]
        indexes  = [models.Index(fields=["loan", "status", "position"])]
    
    def __str__(self):
        return f"{self.title} ({self.status})"
      


class IncomeAssetNote(models.Model):
    loan = models.OneToOneField("Loan", on_delete=models.CASCADE, related_name="income_asset_note")
    editor_state = models.JSONField(default=dict, blank=True)   # stores Lexical JSON as-is
    plain_text = models.TextField(blank=True)                   # optional quick-read/search
    created_by = models.ForeignKey(get_user_model(), null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="income_asset_notes_created")
    updated_by = models.ForeignKey(get_user_model(), null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name="income_asset_notes_updated")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"IncomeAssetNote(loan={self.loan_id})"


class LoanMilestoneHistory(models.Model):
    loan = models.ForeignKey(
        Loan,
        on_delete=models.CASCADE,
        related_name="milestone_history"
    )
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.CASCADE
    )
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["changed_at"]

    def __str__(self):
        return f"{self.loan_id} → {self.milestone.name} @ {self.changed_at}"

