from django.contrib import admin
from .models import IncentiveRule, PayrollSettings, EmployeePayroll

@admin.register(IncentiveRule)
class IncentiveRuleAdmin(admin.ModelAdmin):
    list_display = ("id", "role", "milestone", "min_files", "max_files", "amount_per_file")
    search_fields = ("milestone", "role__name")
    list_filter = ("role",)

@admin.register(PayrollSettings)
class PayrollSettingsAdmin(admin.ModelAdmin):
    list_display = ("id", "pf_employee_percent", "pf_employer_percent", "eps_percent",
                    "esi_employee_percent", "esi_employer_percent")

@admin.register(EmployeePayroll)
class EmployeePayrollAdmin(admin.ModelAdmin):
    list_display = ("id", "employee", "month", "gross_salary", "net_salary")
    search_fields = ("employee__name", "employee__login_id")
    list_filter = ("month", "employee")