# employee/tasks.py
from celery import shared_task
from .models import Employee
from .utils import mark_missing_absents

@shared_task(bind=True)
def mark_absent_for_all_employees(self):
    # Only non-archived employees
    employees = Employee.objects.filter(is_archived=False)
    for emp in employees:
        try:
            mark_missing_absents(emp)
        except Exception as e:
            # Log but don't crash the whole task
            # If you have logging configured, use logger.exception
            print(f"[mark_absent_for_all_employees] error for {emp.id}: {e}")
