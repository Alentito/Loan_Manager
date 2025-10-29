from rest_framework import serializers
from .models import IncentiveRule, PayrollSettings, EmployeePayroll
from employee.models import Employee

class IncentiveRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncentiveRule
        fields = "__all__"

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
            "id",
            "employee",
            "employee_id",
            "month",
            "basic_salary",
            "hra",
            "gross_salary",
            "pf_employee_contribution",
            "pf_employer_contribution",
            "eps_contribution",
            "esi_employee_contribution",
            "esi_employer_contribution",
            "incentive_amount",
            "total_deduction",
            "net_salary",
        ]

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

    def validate(self, attrs):
        # Auto-fill computed fields if not provided
        w = {**attrs}
        w = self._compute_from_settings(w)
        return w

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)