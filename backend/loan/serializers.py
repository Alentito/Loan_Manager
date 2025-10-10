from rest_framework import serializers
from .models import Loan, Lender,ChecklistQuestion, LoanContact,LoanDocStatus,Task
from .models import DocOrder
from .models import XMLUpload

from employee.serializers import BrokerSerializer, LoanOfficerSerializer
from employee.models import Broker, LoanOfficer
from employee.serializers import BrokerSerializer, LoanOfficerSerializer, EmployeeSerializer
from employee.models import Broker, LoanOfficer, Employee


from .models import Notification

from rest_framework import serializers
from .models import Milestone
# ...existing imports...

from .models import IncomeAssetNote

class IncomeAssetNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeAssetNote
        fields = ["id", "loan", "editor_state", "plain_text", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at", "loan"]
        

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
    # read-side: nested serializers
    broker = BrokerSerializer(read_only=True)
    loan_officer = LoanOfficerSerializer(read_only=True)

    team_leader = EmployeeSerializer(read_only=True)
    team_manager = EmployeeSerializer(read_only=True)
    processor = EmployeeSerializer(read_only=True)
    support = EmployeeSerializer(read_only=True)

    #lenders = LenderSerializer(read_only=True, many=True)

    # write-only PK fields (frontend should send these on create/update)
    broker_id = serializers.PrimaryKeyRelatedField(
        queryset=Broker.objects.all(), source='broker', write_only=True, required=False, allow_null=True
    )
    loan_officer_id = serializers.PrimaryKeyRelatedField(
        queryset=LoanOfficer.objects.all(), source='loan_officer', write_only=True, required=False, allow_null=True
    )

    team_leader_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), source='team_leader', write_only=True, required=False, allow_null=True
    )
    team_manager_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), source='team_manager', write_only=True, required=False, allow_null=True
    )
    processor_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), source='processor', write_only=True, required=False, allow_null=True
    )
    support_id = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), source='support', write_only=True, required=False, allow_null=True
    )

    
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')



class LenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lender
        fields = '__all__'
