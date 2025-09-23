# tasks.py (celery)
from celery import shared_task
from django.utils import timezone
from zoneinfo import ZoneInfo
from .models import Employee, Attendance, Shift
from datetime import timedelta

CST = ZoneInfo("America/Chicago")

@shared_task
def mark_absent_for_date(target_date_str=None):
    """
    Mark absences for the provided date (YYYY-MM-DD string) or for yesterday in CST.
    This should be scheduled to run after the latest shift ends (e.g., 23:59 CST).
    """
    from datetime import datetime
    if target_date_str:
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    else:
        now_cst = timezone.now().astimezone(CST)
        target_date = now_cst.date()  # or yesterday depending on schedule

    # iterate employees who should have a shift that day
    employees = Employee.objects.filter(is_archived=False)
    for emp in employees:
        # Skip if attendance exists
        if Attendance.objects.filter(employee=emp, date=target_date).exists():
            continue
        # If approved leave exists for this date, create ON_LEAVE (adapt to your leave model)
        # if Leave.objects.filter(...).exists(): ...
        # else create absent
        Attendance.objects.create(employee=emp, date=target_date, status=Attendance.STATUS_ABSENT)
