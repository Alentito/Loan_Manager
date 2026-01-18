from rest_framework import serializers
from employee.models import Broker, LoanOfficer, Employee, PublicHoliday, Meeting,LeaveRequests, Shift, Team, Designation,  Attendance, Break, MonthlyAttendanceSummary, Lender, TeamLead, TeamManager, EmployeeToken, EmployeeBreak, AttendanceLog
from django.contrib.auth.models import Group  # or from userauth.models import Role if custom
from django.contrib.auth import get_user_model
import pytz
from datetime import datetime, timezone as dt_timezone
from django.utils import timezone
from datetime import datetime, date as date_class
from employee.utils import to_cst, to_cst_date
from django.db.models import Sum,F


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


class PublicHolidaySerializer(serializers.ModelSerializer):
    date = serializers.DateField(format="%Y-%m-%d")

    class Meta:
        model = PublicHoliday
        fields = '__all__'

class MeetingSerializer(serializers.ModelSerializer):
    employees = serializers.PrimaryKeyRelatedField(
        queryset=Employee.objects.all(), many=True, required=False
    )
    date = serializers.DateField(write_only=True, required=True)
    time = serializers.TimeField(write_only=True, required=True)
    datetime = serializers.SerializerMethodField(read_only=True)  # ✅ formatted CST

    class Meta:
        model = Meeting
        fields = ['id', 'title', 'description', 'datetime', 'date', 'time', 'employees']

    def get_datetime(self, obj):
        dt_cst = to_cst(obj.datetime)
        return dt_cst.strftime("%Y-%m-%dT%H:%M:%S") if dt_cst else None

    def create(self, validated_data):
        date = validated_data.pop('date')
        time = validated_data.pop('time')
        # ✅ combine and store as UTC
        dt_cst = datetime.combine(date, time, tzinfo=CST)
        validated_data['datetime'] = dt_cst.astimezone(dt_timezone.utc)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        date = validated_data.pop('date', None)
        time = validated_data.pop('time', None)
        if date and time:
            dt_cst = datetime.combine(date, time, tzinfo=CST)
            validated_data['datetime'] = dt_cst.astimezone(dt_timezone.utc)
        return super().update(instance, validated_data)

class EmployeeSerializer(serializers.ModelSerializer):
    roles = serializers.PrimaryKeyRelatedField(queryset=Group.objects.all(), many=True)
    role_names = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name', source='roles')
    team_name = serializers.CharField(source='team.name', read_only=True)
    primary_shift_name = serializers.CharField(source='primary_shift.name', read_only=True)
    alternate_shift_name = serializers.CharField(source='alternate_shift.name', read_only=True)
    manager_id = serializers.IntegerField(source='team.manager.id', read_only=True)
    team_manager_name = serializers.CharField(source='team.manager.name', read_only=True)  # ✅ new
    team_head_name = serializers.CharField(source='team.head.name', read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'user', 'roles', 'role_names', 'login_id', 'name',
            'company_email', 'contact_number', 'designation', 'team',
            'team_head_name',
            'primary_shift', 'alternate_shift', 'is_archived',
            'archived_at', 'created_at', 'updated_at', 'login_password',
            'yearly_paid_leaves', 'leave_balance',
            'team_name', 'primary_shift_name', 'alternate_shift_name',
            'manager_id', 'team_manager_name', 'bank_name',
            'bank_account_no',
            'work_location',"base_salary",
            'hra', 'conveyance_allowance', 'medical_reimbursement',
            'uniform_allowance', 'food_allowance', 'special_allowance',
            'arrear_salary','uan_number', 'tds_amount', 'labour_welfare_fund',

            # --- Variable Earnings ---
            'bonus_amount', 'leave_encashment_amount',
            'overtime_hours', 'overtime_amount',
            'night_shift_allowance', 'comp_off_balance',

            # --- Deductions ---
            'loan_repayment_amount', 'other_deductions',

        ]

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
        new_team = validated_data.get('team', instance.team)
        manual_shift = validated_data.get('primary_shift', None)
        
        # Normalize Team object
        if isinstance(new_team, Team):
            new_team_id = new_team.id
        elif isinstance(new_team, int):
            new_team = Team.objects.get(pk=new_team)
            new_team_id = new_team.id
        elif new_team is None:
            new_team_id = instance.team_id
        else:
            new_team_id = int(new_team)
            new_team = Team.objects.get(pk=new_team_id)

        # ✅ Auto-update shift when team changes
        if new_team_id != instance.team_id:
            validated_data['primary_shift'] = new_team.shift  # use team's shift
            validated_data['alternate_shift'] = None  # or keep existing if needed
            print(
                f"Team changed from {instance.team_id} → {new_team_id}, "
                f"shift updated to {new_team.shift}"
            )

        # Apply remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if roles is not None:
            instance.roles.set(roles)

        return instance


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
    employee_balance = serializers.IntegerField(source="employee.leave_balance", read_only=True)

    class Meta:
        model = LeaveRequests
        fields = [
        'id', 'employee','employee_balance', 'start_date', 'end_date',
        'reason', 'status', 'approved_by', 'denied_by', 'approval_type',
        'processed_at', 'created_at'
    ]
        read_only_fields = ['employee', 'approved_by', 'denied_by', 'processed_at', 'created_at','employee_balance']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request.user, 'employee'):
            validated_data['employee'] = request.user.employee
        else:
            raise serializers.ValidationError("User is not associated with an employee.")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if instance.status == "approved" and "approval_type" in validated_data:
            raise serializers.ValidationError("Cannot change leave type after approval. Revert to 'pending' first.")
        return super().update(instance, validated_data)


    def validate(self, data):
        request = self.context.get("request")
        if request and hasattr(request.user, "employee"):
            employee = request.user.employee
        else:
            raise serializers.ValidationError("User is not associated with an employee.")

        # ✅ only enforce overlap validation during create
        if request and request.method == "POST" and request.parser_context["view"].action == "create":
            start_date = data.get("start_date")
            end_date = data.get("end_date")

            if start_date and end_date:
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

class AttendanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = ["id", "login_time", "logout_time"]

class AttendanceSerializer(serializers.ModelSerializer):
    breaks = BreakSerializer(many=True, read_only=True)
    total_break_minutes = serializers.IntegerField(read_only=True)
    net_worked_minutes = serializers.SerializerMethodField()

    # ✅ Extra fields
    employee_name = serializers.CharField(source="employee.user.username", read_only=True)
    employee_id = serializers.IntegerField(source="employee.id", read_only=True)
    shift_name = serializers.CharField(source="shift.name", read_only=True)
    leave_balance = serializers.SerializerMethodField()
    yearly_late_seconds = serializers.SerializerMethodField()
    employee_details = EmployeeSerializer(source="employee", read_only=True)
    daily_late_hhmmss = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            "id",
            "employee",
            "employee_id",
            "employee_name",
            "employee_details",
            "date",
            "shift",
            "shift_name",
            "login_time",
            "counted_from",
            "status",
            "minutes_late",
            "daily_late_hhmmss",
            "worked_minutes",
            "total_break_minutes",
            "net_worked_minutes",
            "breaks", 'leave_balance', 'yearly_late_seconds',"login_time", "logout_time", "logs"
        ]
        read_only_fields = [
            "worked_minutes",
            "total_break_minutes",
            "net_worked_minutes",
        ]

    def get_net_worked_minutes(self, obj):
        return max(0, (obj.worked_minutes or 0) - (obj.total_break_minutes or 0))

    def get_leave_balance(self, obj):
        # assuming you pass 'leave_summary' in context
        leave_summary = self.context.get('leave_summary')
        if leave_summary:
            return leave_summary.get('leave_balance', 0)
        return 0

    def get_yearly_late_seconds(self, obj):
    # Fetch total yearly late from context or DB
        leave_summary = self.context.get('leave_summary')
        if leave_summary:
            total_seconds = leave_summary.get('yearly_late_seconds', 0)
            total_minutes = total_seconds // 60
        else:
            total_minutes = Attendance.objects.filter(
                employee=obj.employee,
                date__year=obj.date.year
            ).aggregate(total_late=Sum("minutes_late"))["total_late"] or 0

        # Subtract grace from each attendance record
        grace_total = Attendance.objects.filter(
            employee=obj.employee,
            date__year=obj.date.year,
            shift__isnull=False
        ).annotate(
            grace_minutes=F("shift__grace_period_minutes")
        ).aggregate(total_grace=Sum("grace_minutes"))["total_grace"] or 0

        adjusted_minutes = max(0, total_minutes - grace_total)
        return adjusted_minutes * 60  # convert back to seconds


    def get_daily_late_hhmmss(self, obj):
        if not obj.minutes_late or not obj.shift:
            return "00:00:00"

        grace = obj.shift.grace_period_minutes or 0
        adjusted_minutes = max(0, obj.minutes_late - grace)
        total_seconds = adjusted_minutes * 60
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"


    def get_status(self, obj):
        if obj.minutes_late > 0:
            return "LATE"
        return obj.status.upper() if obj.status else "ABSENT"
    
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
    employee_name = serializers.SerializerMethodField()
    employee_login_id = serializers.SerializerMethodField()
    responder_name = serializers.CharField(source='responder.username', read_only=True)
    
    class Meta:
        model = EmployeeToken
        fields = [
            'id', 'employee', 'employee_login_id', 'employee_name', 'title', 'description',
            'responder', 'responder_name', 'response', 'status',
            'created_at', 'responded_at'
        ]
        read_only_fields = ['employee', 'responder', 'status', 'responded_at', 'created_at']


    def get_employee_name(self, obj):
        return getattr(obj.employee.employee, "name", None) if hasattr(obj.employee, "employee") else obj.employee.username

    def get_employee_login_id(self, obj):
        return getattr(obj.employee.employee, "login_id", None) if hasattr(obj.employee, "employee") else None
    
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



