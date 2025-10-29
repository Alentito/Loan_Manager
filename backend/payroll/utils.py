



def calculate_incentive(employee, month):
    total_files = Loan.objects.filter(
        assigned_to=employee,
        milestone='funded',
        funded_date__month=month.month,
        funded_date__year=month.year
    ).count()

    role = employee.role
    rules = IncentiveRule.objects.filter(role=role, milestone='funded')

    incentive = 0
    for rule in rules:
        if (rule.max_files and rule.min_files <= total_files <= rule.max_files) or \
           (not rule.max_files and total_files > rule.min_files):
            incentive = total_files * rule.amount_per_file
            break

    return incentive


def calculate_statutory_deductions(employee, gross_salary, settings: PayrollSettings):
    pf_employee = gross_salary * (settings.pf_employee_percent / 100)
    pf_employer = gross_salary * (settings.pf_employer_percent / 100)
    eps = gross_salary * (settings.eps_percent / 100)
    esi_employee = gross_salary * (settings.esi_employee_percent / 100)
    esi_employer = gross_salary * (settings.esi_employer_percent / 100)
    
    return {
        'pf_employee': round(pf_employee, 2),
        'pf_employer': round(pf_employer, 2),
        'eps': round(eps, 2),
        'esi_employee': round(esi_employee, 2),
        'esi_employer': round(esi_employer, 2)
    }


