from rest_framework import serializers  # type: ignore
from decimal import Decimal
from django.contrib.auth.models import Group  # type: ignore
from .models import IncentiveRule, PayrollSettings, EmployeePayroll
from employee.models import Employee
from loan.serializers import MilestoneListSerializer  # optional, only if milestone is FK
from loan.models import Milestone 

class IncentiveRuleSerializer(serializers.ModelSerializer):
    roles = serializers.PrimaryKeyRelatedField(  # corrected name
        queryset=Group.objects.all(), write_only=True, many=True, required=False
    )
    role_detail = serializers.SerializerMethodField(read_only=True)
    milestone_detail = MilestoneListSerializer(source="milestone", read_only=True)
    milestone_id = serializers.PrimaryKeyRelatedField(
        source="milestone", queryset=Milestone.objects.all(),
        write_only=True, required=False, allow_null=True
    )

    # Backward-compatible simple name fields for UI convenience
    role = serializers.SerializerMethodField(read_only=True)
    milestone = serializers.CharField(source="milestone.name", read_only=True, allow_null=True)

    class Meta:
        model = IncentiveRule
        fields = [
            "id","roles","role_detail","role","milestone_id","milestone_detail","milestone",
            "min_files","max_files","amount_per_file","is_active","priority",
            "created_at","updated_at"
        ]

    def get_role_detail(self, obj):
        # Expose both id and name so the UI can render readable role labels
        return [{"id": g.id, "name": g.name} for g in obj.roles.all()]

    def get_role(self, obj):
        names = [g.name for g in obj.roles.all()]
        return ", ".join(names) if names else ""

    def validate(self, attrs):
        min_f = attrs.get("min_files", getattr(self.instance, "min_files", None))
        max_f = attrs.get("max_files", getattr(self.instance, "max_files", None))
        if max_f is not None and max_f < min_f:
            raise serializers.ValidationError("max_files must be >= min_files")
        return attrs

    def create(self, validated_data):
        roles = validated_data.pop("roles", [])
        instance = IncentiveRule.objects.create(**validated_data)
        if roles:
            instance.roles.set(roles)
        return instance

    def update(self, instance, validated_data):
        roles = validated_data.pop("roles", None)
        for k,v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        if roles is not None:
            instance.roles.set(roles)
        return instance

    

class PayrollSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollSettings
        fields = "__all__"

class EmployeeLiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ("id", "name", "login_id", "company_email")

class EmployeePayrollSerializer(serializers.ModelSerializer):
    employee = EmployeeLiteSerializer(read_only=True)
    employee_id = serializers.PrimaryKeyRelatedField(
        source="employee", queryset=Employee.objects.all(), write_only=True
    )

    class Meta:
        model = EmployeePayroll
        fields = [
            "id","employee","employee_id","month",
            "base_salary","hra","other_allowances",
            "working_days","present_days","paid_leave_days","unpaid_leave_days","payable_days",
            "prorated_base","loan_count","incentive_amount","incentive_breakdown",
            "gross_salary",
            "pf_employee_contribution","pf_employer_contribution","eps_contribution",
            "esi_employee_contribution","esi_employer_contribution",
            "other_deductions","total_deductions","net_salary",
            "status","notes","created_at","updated_at"
        ]
        read_only_fields = ["created_at","updated_at"]

    def validate(self, attrs):
        gross = attrs.get("gross_salary") or getattr(self.instance, "gross_salary", Decimal("0.00"))
        if gross < 0:
            raise serializers.ValidationError("gross_salary must be >= 0")
        return attrs

    def _compute_from_settings(self, data):
        # Pull latest settings (or defaults if none)
        settings = PayrollSettings.objects.order_by("-id").first()
        pf_emp_pct = float(getattr(settings, "pf_employee_percent", 12.0))
        pf_empr_pct = float(getattr(settings, "pf_employer_percent", 3.67))
        eps_pct = float(getattr(settings, "eps_percent", 8.33))
        esi_emp_pct = float(getattr(settings, "esi_employee_percent", 0.75))
        esi_empr_pct = float(getattr(settings, "esi_employer_percent", 3.25))

        gross = float(data.get("gross_salary") or 0)
        # Contributions (rounded to 2 decimals)
        pf_emp = round(gross * pf_emp_pct / 100.0, 2)
        pf_empr = round(gross * pf_empr_pct / 100.0, 2)
        eps = round(gross * eps_pct / 100.0, 2)
        esi_emp = round(gross * esi_emp_pct / 100.0, 2)
        esi_empr = round(gross * esi_empr_pct / 100.0, 2)
        incentive = float(data.get("incentive_amount") or 0)

        total_deduction = round(pf_emp + esi_emp, 2)
        net_salary = round(gross - total_deduction + incentive, 2)

        data.setdefault("pf_employee_contribution", pf_emp)
        data.setdefault("pf_employer_contribution", pf_empr)
        data.setdefault("eps_contribution", eps)
        data.setdefault("esi_employee_contribution", esi_emp)
        data.setdefault("esi_employer_contribution", esi_empr)
        data.setdefault("total_deduction", total_deduction)
        data.setdefault("net_salary", net_salary)
        return data


    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)