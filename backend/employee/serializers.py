<<<<<<< HEAD
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
=======
from rest_framework import serializers
from employee.models import Broker, LoanOfficer, Employee, PublicHoliday, Meeting,LeaveRequests, Shift, Team, Designation,  Attendance, Break, MonthlyAttendanceSummary, Lender, TeamLead, TeamManager, EmployeeToken, EmployeeBreak
from django.contrib.auth.models import Group  # or from userauth.models import Role if custom
from django.contrib.auth import get_user_model
import pytz
from datetime import datetime
from django.utils import timezone
from datetime import datetime, date as date_class

CST = pytz.timezone("America/Chicago")

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
    manager_id = serializers.IntegerField(source='team.manager.id', read_only=True)
    team_manager_name = serializers.CharField(source='team.manager.name', read_only=True)  # ✅ new

    class Meta:
        model = Employee
        fields = '__all__'

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

        # Only auto-set shift **if shift is NOT provided**
        if team and 'primary_shift' not in validated_data:
            validated_data['primary_shift'] = team.shift

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if roles is not None:
            instance.roles.set(roles)

        return instance



class PublicHolidaySerializer(serializers.ModelSerializer):
    date = serializers.DateField(format="%Y-%m-%d")

    class Meta:
        model = PublicHoliday
        fields = '__all__'

class MeetingSerializer(serializers.ModelSerializer):
    employees = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), many=True, required=False
    )
    date = serializers.DateField(format="%Y-%m-%d")

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

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = get_user_model()
        fields = ['id', 'username', 'email']  # add what you need

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee = EmployeeBasicSerializer(read_only=True)
    approved_by = UserBasicSerializer(read_only=True)
    denied_by = UserBasicSerializer(read_only=True)


    class Meta:
        model = LeaveRequests
        fields = [
        'id', 'employee', 'leave_type', 'start_date', 'end_date',
        'reason', 'status', 'approved_by', 'denied_by',
        'processed_at', 'created_at'
    ]
        read_only_fields = ['employee', 'approved_by', 'denied_by', 'processed_at', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'employee'):
            validated_data['employee'] = request.user.employee
        else:
            raise serializers.ValidationError("User is not associated with an employee.")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if instance.status != "pending":
            raise serializers.ValidationError("This request has already been processed.")
        return super().update(instance, validated_data)

    def validate_leave_type(self, value):
        if value not in ["Paid Leave", "Unpaid Leave"]:
            raise serializers.ValidationError("Leave type must be either 'Paid Leave' or 'Unpaid Leave'.")
        return value

    def validate(self, data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'employee'):
            employee = request.user.employee
        else:
            raise serializers.ValidationError("User is not associated with an employee.")

        start_date = data.get('start_date')
        end_date = data.get('end_date')

        # Check for overlapping leave
        exists = LeaveRequests.objects.filter(
            employee=employee,
            start_date__lte=end_date,
            end_date__gte=start_date
        ).exists()
        if exists:
            raise serializers.ValidationError("You already have a leave request on this date.")

        return data

    def to_internal_value(self, data):

        def _parse_to_date(value):
            if not value:
                return None
            # If already a date/datetime object, handle directly
            if isinstance(value, date_class):
                return value
            if isinstance(value, datetime):
                # make aware (assume UTC if naive), convert to CST, take date
                dt = value if value.tzinfo else timezone.make_aware(value, timezone.utc)
                return dt.astimezone(CST).date()

            s = str(value)
            # date-only ISO (YYYY-MM-DD)
            if len(s) == 10 and s[4] == "-" and s[7] == "-":
                # safe date parsing
                try:
                    return date_class.fromisoformat(s)
                except Exception:
                    pass

            # handle trailing 'Z' (Zulu)
            if s.endswith("Z"):
                s = s[:-1] + "+00:00"

            # Try datetime.fromisoformat (accepts offsets like +00:00)
            try:
                dt = datetime.fromisoformat(s)
            except Exception:
                # fallback: try parsing as naive datetime in UTC
                try:
                    dt = datetime.strptime(s, "%Y-%m-%dT%H:%M:%S")
                    dt = timezone.make_aware(dt, timezone.utc)
                except Exception:
                    # give up — return None so validation will catch bad data
                    return None

            # ensure aware, convert to CST, return date
            if dt.tzinfo is None:
                dt = timezone.make_aware(dt, timezone.utc)
            return dt.astimezone(CST).date()

        # parse start/end and replace in incoming data if possible
        sd = data.get("start_date")
        ed = data.get("end_date")

        parsed_sd = _parse_to_date(sd) if sd is not None else None
        parsed_ed = _parse_to_date(ed) if ed is not None else None

        if parsed_sd is not None:
            data["start_date"] = parsed_sd
        if parsed_ed is not None:
            data["end_date"] = parsed_ed

        return super().to_internal_value(data)
    
class ShiftSerializer(serializers.ModelSerializer):
    start_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'])
    end_time = serializers.TimeField(format='%H:%M', input_formats=['%H:%M'])
    class Meta:
        model = Shift
        fields = '__all__'


class TeamSerializer(serializers.ModelSerializer):
    head_name = serializers.CharField(source='head.name', read_only=True)
    manager_name = serializers.CharField(source='manager.name', read_only=True)
    shift_name = serializers.CharField(source='shift.name', read_only=True)

    shift = serializers.PrimaryKeyRelatedField(queryset=Shift.objects.all())
    head = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), allow_null=True)
    manager = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), allow_null=True)

    class Meta:
        model = Team
        fields = '__all__'

    def validate(self, data):
        head = data.get("head")
        manager = data.get("manager")

        # Head and manager cannot be the same person
        if head and manager and head == manager:
            raise serializers.ValidationError(
                {"manager": "An employee cannot be both Head and Manager of the same team."}
            )

        # Head cannot be assigned to multiple managers
        if head:
            existing_team = Team.objects.filter(head=head).exclude(id=self.instance.id if self.instance else None).first()
            if existing_team:
                raise serializers.ValidationError(
                    {"head": f"{head.name} is already assigned under manager {existing_team.manager.name}."}
                )

        # Optional: Manager uniqueness (if you want only one team per manager)
        if manager:
            existing_manager_team = Team.objects.filter(manager=manager).exclude(id=self.instance.id if self.instance else None).first()
            if existing_manager_team:
                # Only enforce if manager should be unique per team
                pass  # skip if multiple teams per manager allowed

        return data

     

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ['id', 'name']



class BreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = Break
        fields = ["id", "attendance", "break_in", "break_out", "duration_minutes"]
        read_only_fields = ["id", "break_out", "duration_minutes"]

    # Optional: format datetime fields nicely
    break_in = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    break_out = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    
class AttendanceSerializer(serializers.ModelSerializer):
    breaks = BreakSerializer(many=True, read_only=True)
    total_break_minutes = serializers.IntegerField(read_only=True)
    net_worked_minutes = serializers.SerializerMethodField()

    # ✅ Extra fields
    employee_name = serializers.CharField(source="employee.user.username", read_only=True)
    employee_id = serializers.IntegerField(source="employee.id", read_only=True)
    shift_name = serializers.CharField(source="shift.name", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "employee",
            "employee_id",
            "employee_name",
            "date",
            "shift",
            "shift_name",
            "login_time",
            "counted_from",
            "status",
            "minutes_late",
            "worked_minutes",
            "total_break_minutes",
            "net_worked_minutes",
            "breaks",
        ]
        read_only_fields = [
            "worked_minutes",
            "total_break_minutes",
            "net_worked_minutes",
        ]

    def get_net_worked_minutes(self, obj):
        return max(0, (obj.worked_minutes or 0) - (obj.total_break_minutes or 0))


class MonthlyAttendanceSummarySerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.user.username", read_only=True)
    attendance_details = serializers.SerializerMethodField()
    class Meta:
        model = MonthlyAttendanceSummary
        fields = [
            "id", "employee", "employee_name",
            "year", "month",
            "early_count", "present_count",
            "late_count", "absent_count", "leave_count",
            "created_at", "updated_at",
        ]

    def get_attendance_details(self, obj):
        att = obj.employee.attendances.filter(
            date__year=obj.year, date__month=obj.month
        ).values("date", "status")
        return list(att)

class LenderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lender
        fields = "__all__"



class TeamLeadSerializer(serializers.ModelSerializer):
    # Extra fields for convenience
    lead_login_id = serializers.CharField(source="lead.login_id", read_only=True)
    member_login_ids = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = TeamLead
        fields = [
            "id",
            "lead",              # FK: required when creating/updating
            "lead_login_id",     # computed
            "members",           # M2M: required when creating/updating
            "member_login_ids",  # computed
            "created_at",
            "updated_at",
        ]

    def get_member_login_ids(self, obj):
        return [m.login_id for m in obj.members.all()]

    # 🔹 Validation
    def validate(self, attrs):
        lead = attrs.get("lead") or (self.instance.lead if self.instance else None)
        members = attrs.get("members") or (self.instance.members.all() if self.instance else [])

        # 1️⃣ Lead cannot also be a member of the same team
        if lead and lead in members:
            raise serializers.ValidationError(
                {"members": "The team lead cannot also be a member of the same team."}
            )

        # 2️⃣ Lead cannot be a lead in another team
        if lead and TeamLead.objects.filter(lead=lead).exclude(
            id=self.instance.id if self.instance else None
        ).exists():
            raise serializers.ValidationError(
                {"lead": f"Employee {lead.login_id} is already a team lead in another team."}
            )

        # 3️⃣ Members cannot be a lead in another team
        for member in members:
            if TeamLead.objects.filter(lead=member).exclude(
                id=self.instance.id if self.instance else None
            ).exists():
                raise serializers.ValidationError(
                    {"members": f"Employee {member.login_id} is already a team lead in another team."}
                )

        # 4️⃣ Members cannot belong to more than one team
        for member in members:
            if TeamLead.objects.filter(members=member).exclude(
                id=self.instance.id if self.instance else None
            ).exists():
                raise serializers.ValidationError(
                    {"members": f"Employee {member.login_id} is already a member of another team."}
                )

        return attrs
    

class TeamManagerSerializer(serializers.ModelSerializer):
    manager_login_id = serializers.CharField(source="manager.login_id", read_only=True)
    manager_name = serializers.CharField(source="manager.name", read_only=True)
    team_leads_data = serializers.SerializerMethodField()
    members_data = serializers.SerializerMethodField()

    class Meta:
        model = TeamManager
        fields = [
            "id",
            "manager",
            "manager_login_id",
            "manager_name",
            "team_leads",
            "team_leads_data",
            "members_data",
            "created_at",
            "updated_at",
        ]

    def get_team_leads_data(self, obj):
        return [{"id": lead.id, "lead_login_id": lead.lead_login_id} for lead in obj.team_leads.all()]

    def get_members_data(self, obj):
        # aggregated members from all leads
        return [{"id": m.id, "login_id": m.login_id, "name": m.name} for m in obj.members]

    def validate_manager(self, value):
        # Ensure selected manager is not already a team lead
        if hasattr(value, "lead"):
            raise serializers.ValidationError(f"{value.login_id} is already a Team Lead and cannot be a manager.")
        return value
    

class EmployeeTokenSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.username', read_only=True)
    responder_name = serializers.CharField(source='responder.username', read_only=True)

    class Meta:
        model = EmployeeToken
        fields = [
            'id', 'employee', 'employee_name', 'title', 'description',
            'responder', 'responder_name', 'response', 'status',
            'created_at', 'responded_at'
        ]
        read_only_fields = ['employee', 'responder', 'status', 'responded_at', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['employee'] = request.user
        else:
            raise serializers.ValidationError("User must be authenticated to create a token.")

        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = request.user

        if user == instance.employee:
            if instance.status != "pending":
                raise serializers.ValidationError("Cannot edit once responded.")
            # employee can update title/description
            instance.title = validated_data.get("title", instance.title)
            instance.description = validated_data.get("description", instance.description)
            instance.save()
            return instance

        # Responder logic
        if instance.status == "responded":
            raise serializers.ValidationError("This token has already been responded to.")
        instance.response = validated_data.get("response", instance.response)
        instance.status = "responded"
        instance.responder = user
        instance.responded_at = timezone.now()
        instance.save()
        return instance


class EmployeeBreakSerializer(serializers.ModelSerializer):
    duration_seconds = serializers.ReadOnlyField()
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)  # <- important

    class Meta:
        model = EmployeeBreak
        fields = ['id', 'employee', 'start_time', 'end_time', 'reason', 'duration_seconds']
        read_only_fields = ['employee']
>>>>>>> 00f6f991e (Initial commit of backend and frontend project)
