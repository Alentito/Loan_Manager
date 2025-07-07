from rest_framework import serializers
from employee.models import broker, LoanOfficer, Employee, Attendance, PublicHoliday, Meeting

class BrokerSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(use_url=True, required=False, allow_null=True)

    class Meta:
        model = broker
        fields = [
            'id',
            'name',
            'email',
            'NMLS',
            'primary_phone',
            'phone',
            'address',
            'company_address',
            'logo',
            'designation',
            'entregar_email',
            'entregar_fax',
            'entregar_phone',
            'signature',
            'doc_order_option',
            'submission_checklist',
            'created_at',
            'updated_at',
        ]

    def update(self, instance, validated_data):
        # Handle logo separately (only update if explicitly passed)
        logo = validated_data.pop('logo', None)
        if logo is not None:
            instance.logo = logo

        # Update other fields, including empty strings
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


class LoanOfficerSerializer(serializers.ModelSerializer):
    broker_company_name = serializers.CharField(source='broker_company.name', read_only=True)

    class Meta:
        model = LoanOfficer
        fields = ['id', 'name', 'contact_number', 'email', 'NMLS', 'broker_company', 'broker_company_name', 'created_at', 'updated_at']


class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = [
            'id',
            'login_id',
            'name',
            'company_email',
            'contact_number',
            'position',
            'performance_score',
            'experience_months',
            'bank_name',
            'account_number',
            'bank_details',
            'address',
            'date_of_join',
            'status',
            'login_password',
            'leave_balance',
            'date_joined',
            'updated_at',
        ]
        extra_kwargs = {
            'login_password': {'write_only': False, 'required': False},  # Set write_only=True after debugging
            'leave_balance': {'read_only': True},
        }

    def create(self, validated_data):
        print("🔐 Creating employee with password:", validated_data.get('login_password'))
        return Employee.objects.create(**validated_data)

    def update(self, instance, validated_data):
        print("✏️ Updating employee with password:", validated_data.get('login_password'))
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'date', 'status']
        

class PublicHolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicHoliday
        fields = '__all__'


class MeetingSerializer(serializers.ModelSerializer):
    employees = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), many=True, required=False
    )

    class Meta:
        model = Meeting
        fields = ['id', 'title', 'description', 'date', 'time', 'employees']