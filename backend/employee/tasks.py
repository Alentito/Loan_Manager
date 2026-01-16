# employee/tasks.py
from celery import shared_task
from employee.models import Employee
from employee.utils import mark_missing_absents

@shared_task
def mark_daily_absents():
    for emp in Employee.objects.filter(is_active=True):
        mark_missing_absents(emp)
