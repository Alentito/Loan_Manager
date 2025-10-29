from django.db import models
from userauth.models import Role
from employee.models import Employee

# Create your models here.
class IncentiveRule(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    milestone = models.CharField(max_length=100)  # e.g. 'funded', 'prequal'
    min_files = models.IntegerField()
    max_files = models.IntegerField(null=True, blank=True)  # null means "above"
    amount_per_file = models.DecimalField(max_digits=10, decimal_places=2)


class PayrollSettings(models.Model):
    pf_employee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=12.00)
    pf_employer_percent = models.DecimalField(max_digits=5, decimal_places=2, default=3.67)
    eps_percent = models.DecimalField(max_digits=5, decimal_places=2, default=8.33)
    esi_employee_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.75)
    esi_employer_percent = models.DecimalField(max_digits=5, decimal_places=2, default=3.25)


class EmployeePayroll(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    month = models.DateField()
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2)
    pf_employee_contribution = models.DecimalField(max_digits=10, decimal_places=2)
    pf_employer_contribution = models.DecimalField(max_digits=10, decimal_places=2)
    eps_contribution = models.DecimalField(max_digits=10, decimal_places=2)
    esi_employee_contribution = models.DecimalField(max_digits=10, decimal_places=2)
    esi_employer_contribution = models.DecimalField(max_digits=10, decimal_places=2)
    incentive_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_deduction = models.DecimalField(max_digits=10, decimal_places=2)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)

