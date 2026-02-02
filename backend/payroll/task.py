

@shared_task
def generate_monthly_payroll():
    settings = PayrollSettings.objects.first()
    for employee in Employee.objects.all():
        basic = employee.basic_salary
        hra = basic * Decimal('0.4')
        gross = basic + hra

        incentive = calculate_incentive(employee, timezone.now())
        deductions = calculate_statutory_deductions(employee, gross, settings)

        total_deduction = deductions['pf_employee'] + deductions['esi_employee']
        net_salary = gross + incentive - total_deduction

        EmployeePayroll.objects.create(
            employee=employee,
            month=timezone.now(),
            basic_salary=basic,
            hra=hra,
            gross_salary=gross,
            incentive_amount=incentive,
            pf_employee_contribution=deductions['pf_employee'],
            pf_employer_contribution=deductions['pf_employer'],
            eps_contribution=deductions['eps'],
            esi_employee_contribution=deductions['esi_employee'],
            esi_employer_contribution=deductions['esi_employer'],
            total_deduction=total_deduction,
            net_salary=net_salary
        )
