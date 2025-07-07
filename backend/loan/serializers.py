from rest_framework import serializers
from .models import Loan, Broker, Employee,Lender,ChecklistQuestion, LoanContact,LoanDocStatus,Task
from .models import DocOrder
from .models import XMLUpload

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
    class Meta:
        model = Loan
        fields = '__all__'

class BrokerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Broker
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'


class LenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lender
        fields = '__all__'
