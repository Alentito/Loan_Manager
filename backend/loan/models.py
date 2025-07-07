from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()
# models.py
class XMLUpload(models.Model):
    file = models.FileField(upload_to='xml_uploads/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    error_message = models.TextField(blank=True, null=True)

class TaskStatus(models.TextChoices):
    TODO        = "To Do",        "To Do"
    IN_PROGRESS = "In Progress",  "In Progress"
    IN_REVIEW   = "In Review",    "In Review"
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
class Broker(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Lender(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Employee(models.Model):
    ROLE_CHOICES = [
        ('loan_officer', 'Loan Officer'),
        ('team_leader', 'Team Leader'),
        ('team_manager', 'Team Manager'),
        ('processor', 'Processor'),
        ('support', 'Support'),
    ]
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)

    def __str__(self):
        return f"{self.name} ({self.role})"


class Loan(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100,default="Unknown")

    broker = models.ForeignKey(Broker, on_delete=models.SET_NULL, null=True)
    loan_officer = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_officer')
    milestone = models.CharField(max_length=100,null=True)

    compensation = models.CharField(max_length=100, blank=True, null=True)
    lock_status = models.CharField(max_length=100, blank=True, null=True)
    closing_date = models.DateField(blank=True, null=True)
    point_file = models.CharField(max_length=255, blank=True, null=True)
    subject_property = models.CharField(max_length=255, blank=True, null=True)
    loan_comment = models.TextField(blank=True, null=True)

    lenders = models.JSONField(default=list, blank=True)

    team_leader = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_team_leader')
    team_manager = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_team_manager')
    processor = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_processor')
    support = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='loans_support')

    created_at = models.DateTimeField(auto_now_add=True)
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
    purpose      = models.CharField(max_length=50, null=True, blank=True)
    note_amount  = models.DecimalField(max_digits=12, decimal_places=2,
                                   null=True, blank=True)
    note_rate    = models.DecimalField(max_digits=6, decimal_places=3,
                                   null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.subject_property or 'Loan'}"


class Task(models.Model):
    loan       = models.ForeignKey(Loan, related_name="tasks",
                                   on_delete=models.CASCADE)
    title      = models.CharField(max_length=160)
    description= models.TextField(blank=True)
    status     = models.CharField(max_length=20,
                                  choices=TaskStatus.choices,
                                  default=TaskStatus.TODO)
    position   = models.PositiveIntegerField(default=0)      # order in column
    assignee   = models.ForeignKey(User, null=True, blank=True,
                                   on_delete=models.SET_NULL)
    tags       = models.JSONField(default=list, blank=True)  # ["Bug", "Story"]
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["status", "position", "-updated_at"]
        indexes  = [models.Index(fields=["loan", "status", "position"])]
      