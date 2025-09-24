from rest_framework import serializers
from .models import Loan, ChecklistQuestion, LoanContact,LoanDocStatus,Task
from .models import DocOrder
from .models import XMLUpload
from employee.serializers import BrokerSerializer, LoanOfficerSerializer, EmployeeSerializer
from employee.models import Broker, LoanOfficer, Employee


from .models import Notification

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
    class Meta:
        model  = Task
        fields = "__all__"           # id, loan, title, status, …
        read_only_fields = ("id","loan", "created_at", "updated_at")

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



