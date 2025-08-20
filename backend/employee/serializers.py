from rest_framework import serializers
from employee.models import Broker, LoanOfficer, Employee, Attendance, PublicHoliday, Meeting,LeaveRequests, Shift, Team, Designation
from django.contrib.auth.models import Group  # or from userauth.models import Role if custom

class BrokerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Broker
        fields =fields = '__all__'

   


class LoanOfficerSerializer(serializers.ModelSerializer):
    broker_company_name = serializers.CharField(source='broker_company.name', read_only=True)

    class Meta:
        model = LoanOfficer
        fields = ['id', 'name', 'contact_number', 'email', 'NMLS', 'broker_company', 'broker_company_name', 'created_at', 'updated_at','archived_at', 'is_archived']


class EmployeeSerializer(serializers.ModelSerializer):
    roles = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True
    )
    team_name = serializers.CharField(source='team.name', read_only=True)
    primary_shift_name = serializers.CharField(source='primary_shift.name', read_only=True)
    alternate_shift_name = serializers.CharField(source='alternate_shift.name', read_only=True)

    class Meta:
        model = Employee
        fields =fields = '__all__'

    def create(self, validated_data):
        roles = validated_data.pop('roles', [])
        team = validated_data.get('team', None)

        if team and not validated_data.get('primary_shift'):
            validated_data['primary_shift'] = team.shift

        employee = Employee.objects.create(**validated_data)
        employee.roles.set(roles)
        return employee

    def update(self, instance, validated_data):
        roles = validated_data.pop('roles', None)
        team = validated_data.get('team', instance.team)

        if team and not validated_data.get('primary_shift'):
            validated_data['primary_shift'] = team.shift

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if roles is not None:
            instance.roles.set(roles)

        return instance


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'employee', 'date', 'status', 'login_time']
      

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
        fields = '__all__'
        
class EmployeeBasicSerializer(serializers.ModelSerializer):
    team = serializers.StringRelatedField()
    primary_shift = serializers.StringRelatedField()
    alternate_shift = serializers.StringRelatedField()
    
    class Meta:
        model = Employee
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = EmployeeBasicSerializer(read_only=True)

    class Meta:
        model = LeaveRequests
        fields = '__all__'
        
        
    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'employee'):
            validated_data['employee'] = request.user.employee
        else:
            raise serializers.ValidationError("User is not associated with an employee.")
        return super().create(validated_data)


class ShiftSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'])
    end_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'])
    class Meta:
        model = Shift
        fields = '__all__'


class TeamSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head.name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    shift = serializers.PrimaryKeyRelatedField(queryset=Shift.objects.all())

    class Meta:
        model = Team
        fields = '__all__'
     

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ['id', 'name']