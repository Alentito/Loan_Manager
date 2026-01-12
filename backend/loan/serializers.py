from rest_framework import serializers
from .models import Loan, ChecklistQuestion, LoanContact,LoanDocStatus,Task
from .models import DocOrder
from .models import XMLUpload

from employee.serializers import BrokerSerializer, LoanOfficerSerializer
from employee.models import Broker, LoanOfficer


from employee.serializers import BrokerSerializer, LoanOfficerSerializer, EmployeeSerializer, LenderSerializer
from employee.models import Broker, LoanOfficer, Employee,Lender


from .models import Notification, LoanMilestoneHistory

from rest_framework import serializers
from .models import Milestone,LoanRoleAssignment
# ...existing imports...


from rest_framework import serializers
from .models import IncomeAssetNote
from django.contrib.auth.models import Group

class IncomeAssetNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeAssetNote
        fields = ["id", "loan", "editor_state", "plain_text", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "loan"]


class LoanRoleAssignmentSerializer(serializers.ModelSerializer):
    # write
    role_id = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), source='role')
    employee_ids = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), source='employees', many=True, write_only=True)
    # read
    role_name = serializers.CharField(source='role.name', read_only=True)
    employees = EmployeeSerializer(many=True, read_only=True)

    class Meta:
        model = LoanRoleAssignment
        fields = ['role_id', 'role_name', 'employee_ids', 'employees']


        

class MilestoneSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = Milestone
        fields = [
            'id',
            'name',
            'description',
            'color',
            'background_color',
            'status',
            'sort_order',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
            'notify_on_reach',
            "include_in_reports",
            "include_in_payroll",
            'created_by_name',
            'updated_by_name',
            'is_active',
        ]
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    
    def validate_name(self, value):
        """Validate milestone name is unique (case-insensitive)"""
        if not value.strip():
            raise serializers.ValidationError("Name cannot be empty.")
        
        # Check for uniqueness (case-insensitive)
        instance = getattr(self, 'instance', None)
        queryset = Milestone.objects.filter(name__iexact=value.strip())
        
        if instance:
            queryset = queryset.exclude(pk=instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A milestone with this name already exists.")
        
        return value.strip()
    
    def validate_sort_order(self, value):
        """Validate sort order is not negative"""
        if value < 0:
            raise serializers.ValidationError("Sort order must be a positive number.")
        return value
    
    def validate_color(self, value):
        """Validate color format"""
        import re
        if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
            raise serializers.ValidationError("Color must be a valid hex code (e.g., #FF0000).")
        return value.upper()
    
    def validate_background_color(self, value):
        """Validate background color format"""
        import re
        if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
            raise serializers.ValidationError("Background color must be a valid hex code (e.g., #FF0000).")
        return value.upper()
    
    def create(self, validated_data):
        """Set created_by field"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Set updated_by field"""
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['updated_by'] = request.user
        return super().update(instance, validated_data)

class MilestoneListSerializer(serializers.ModelSerializer):
    """Simplified serializer for lists"""
    
    class Meta:
        model = Milestone
        fields = [
            'id',
            'name',
            'description',
            'color',
            'background_color',
            'status',
            'sort_order',
            'notify_on_reach',
            "include_in_reports",
            "include_in_payroll",
        ]

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        
class SimpleEmployeeSerializer(serializers.ModelSerializer):
    #full_name = serializers.SerializerMethodField()
    class Meta:
        model = Employee
        fields = ('id', 'name')  # include only what UI needs
    
class XMLUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = XMLUpload
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    """
    Assumptions:
      Task.assignee -> Employee (nullable)
      Task.assigner -> User (auto-set on create)
    """
    assignee = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), allow_null=True, required=False
    )
    assignee_id = serializers.IntegerField(source="assignee.id", read_only=True)
    assignee_name = serializers.SerializerMethodField()

    assigner_id = serializers.IntegerField(source="assigner.id", read_only=True)
    assigner_username = serializers.SerializerMethodField()
    assigner_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id","loan","title","description","status","position",
            "assignee","assignee_id","assignee_name",
            "assigner_id","assigner_username","assigner_name",
            "created_at","updated_at"
        ]
        read_only_fields = ("id","position","assigner_id","assigner_username","assigner_name","created_at","updated_at")

    def get_assignee_name(self, obj):
        if obj.assignee:
            return getattr(obj.assignee, "name", None) or getattr(obj.assignee.user, "username", None)
        return None

    def get_assigner_username(self, obj):
        return obj.assigner.username if obj.assigner else None

    def get_assigner_name(self, obj):
        if obj.assigner:
            full = obj.assigner.get_full_name()
            return full or obj.assigner.username
        return None

    def create(self, validated_data):
        req = self.context.get("request")
        if req and req.user.is_authenticated:
            validated_data["assigner"] = req.user
        return super().create(validated_data)
        
class LoanDocStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanDocStatus
        fields = '__all__'

class DocOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocOrder
        fields = '__all__'
        
class LoanContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanContact
        fields = '__all__'

class ChecklistQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistQuestion
        fields = ['id', 'text', 'order']

class LoanSerializer(serializers.ModelSerializer):

    milestone = MilestoneListSerializer(read_only=True)
    # write via milestone_id
    milestone_id = serializers.PrimaryKeyRelatedField(
        queryset=Milestone.objects.all(), source="milestone",
        write_only=True, required=False, allow_null=True
    )

    role_assignments = LoanRoleAssignmentSerializer(many=True, required=False)


    # read-side: nested serializers
    broker = BrokerSerializer(read_only=True)
    loan_officer = LoanOfficerSerializer(read_only=True)

    # team_leader = EmployeeSerializer(read_only=True)
    # team_manager = EmployeeSerializer(read_only=True)
    # processor = EmployeeSerializer(read_only=True)
    # support = EmployeeSerializer(read_only=True)

    lenders = LenderSerializer(read_only=True, many=True)
    



    #lenders = LenderSerializer(read_only=True, many=True)

    # write-only PK fields (frontend should send these on create/update)
    broker_id = serializers.PrimaryKeyRelatedField(
        queryset=Broker.objects.all(), source='broker', write_only=True, required=False, allow_null=True
    )
    loan_officer_id = serializers.PrimaryKeyRelatedField(
        queryset=LoanOfficer.objects.all(), source='loan_officer', write_only=True, required=False, allow_null=True
    )

    def validate(self, attrs):
        instance = getattr(self, "instance", None)

        borrower_paid = attrs.get(
            "compensation_borrower_paid",
            getattr(instance, "compensation_borrower_paid", False) if instance else False,
        )
        borrower_paid_amount = attrs.get(
            "compensation_borrower_paid_amount",
            getattr(instance, "compensation_borrower_paid_amount", None) if instance else None,
        )
        lender_paid = attrs.get(
            "compensation_lender_paid",
            getattr(instance, "compensation_lender_paid", False) if instance else False,
        )
        lender_paid_amount = attrs.get(
            "compensation_lender_paid_amount",
            getattr(instance, "compensation_lender_paid_amount", None) if instance else None,
        )

        milestone = attrs.get("milestone", getattr(instance, "milestone", None) if instance else None)
        milestone_name = (getattr(milestone, "name", None) or "").strip().lower()
        is_funded_milestone = milestone_name == "funded"

        lock_status = attrs.get(
            "lock_status",
            getattr(instance, "lock_status", None) if instance else None,
        )
        lock_amount = attrs.get(
            "lock_amount",
            getattr(instance, "lock_amount", None) if instance else None,
        )

        funded_check_to_company = attrs.get(
            "funded_check_to_company",
            getattr(instance, "funded_check_to_company", False) if instance else False,
        )
        funded_check_to_company_note = attrs.get(
            "funded_check_to_company_note",
            getattr(instance, "funded_check_to_company_note", None) if instance else None,
        )

        funded_invoice = attrs.get(
            "funded_invoice",
            getattr(instance, "funded_invoice", False) if instance else False,
        )
        funded_invoice_company = attrs.get(
            "funded_invoice_company",
            getattr(instance, "funded_invoice_company", None) if instance else None,
        )
        funded_invoice_entegra_amount = attrs.get(
            "funded_invoice_entegra_amount",
            getattr(instance, "funded_invoice_entegra_amount", None) if instance else None,
        )
        funded_invoice_quantegra_amount = attrs.get(
            "funded_invoice_quantegra_amount",
            getattr(instance, "funded_invoice_quantegra_amount", None) if instance else None,
        )

        errors = {}

        if borrower_paid and borrower_paid_amount is None:
            errors["compensation_borrower_paid_amount"] = "Borrower paid amount is required when Borrower Paid is selected."
        if lender_paid and lender_paid_amount is None:
            errors["compensation_lender_paid_amount"] = "Lender paid amount is required when Lender Paid is selected."

        if is_funded_milestone:
            if funded_check_to_company_note is not None and len(str(funded_check_to_company_note)) > 200:
                errors["funded_check_to_company_note"] = "Must be 200 characters or fewer."
            if funded_invoice:
                if not funded_invoice_company:
                    errors["funded_invoice_company"] = "Company is required when Invoice is selected."
                else:
                    company = str(funded_invoice_company).strip().lower()
                    if company == "entegra":
                        if funded_invoice_entegra_amount is None:
                            errors["funded_invoice_entegra_amount"] = "Amount is required for Entegra when selected."
                    elif company == "quantegra":
                        if funded_invoice_quantegra_amount is None:
                            errors["funded_invoice_quantegra_amount"] = "Amount is required for Quantegra when selected."
                    else:
                        errors["funded_invoice_company"] = "Invalid company."

        if (str(lock_status or "").strip().lower() == "locked") and lock_amount is None:
            errors["lock_amount"] = "Lock amount is required when Lock Status is Locked."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs

    # team_leader_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Employee.objects.all(), source='team_leader', write_only=True, required=False, allow_null=True
    # )
    # team_manager_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Employee.objects.all(), source='team_manager', write_only=True, required=False, allow_null=True
    # )
    # processor_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Employee.objects.all(), source='processor', write_only=True, required=False, allow_null=True
    # )
    # support_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Employee.objects.all(), source='support', write_only=True, required=False, allow_null=True
    # )

    lender_ids = serializers.PrimaryKeyRelatedField(
        queryset=Lender.objects.all(), source='lenders', write_only=True, many=True, required=False
    )

    
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

    def create(self, validated_data):
        ras = validated_data.pop('role_assignments', [])
        loan = super().create(validated_data)
        for item in ras:
            employees = item.pop('employees', [])
            ra = LoanRoleAssignment.objects.create(loan=loan, **item)
            ra.employees.set(employees)

        if loan.milestone:
            LoanMilestoneHistory.objects.create(
                loan=loan,
                milestone=loan.milestone
            )
        return loan

    def update(self, instance, validated_data):
        ras = validated_data.pop('role_assignments', None)
        old_milestone = instance.milestone
        loan = super().update(instance, validated_data)
        if ras is not None:
            LoanRoleAssignment.objects.filter(loan=loan).delete()
            for item in ras:
                employees = item.pop('employees', [])
                ra = LoanRoleAssignment.objects.create(loan=loan, **item)
                ra.employees.set(employees)

            if (
                old_milestone != loan.milestone
                and loan.milestone
                and not LoanMilestoneHistory.objects.filter(
                    loan=loan,
                    milestone=loan.milestone
                ).exists()
            ):
                LoanMilestoneHistory.objects.create(
                    loan=loan,
                    milestone=loan.milestone
                )
        return loan
