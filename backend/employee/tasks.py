# employee/tasks.py
from celery import shared_task
from employee.models import Employee
from employee.utils import mark_missing_absents

@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=10, retry_kwargs={"max_retries": 3})
def mark_daily_absents(self):
    employees = Employee.objects.filter(is_archived=False)
    for emp in employees:
        mark_missing_absents(emp)
    return "Daily absent marking completed"
