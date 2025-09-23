# employee/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Attendance, MonthlyAttendanceSummary


def recalc_monthly_summary(employee, month, year):
    qs = Attendance.objects.filter(employee=employee, date__month=month, date__year=year)

    summary, _ = MonthlyAttendanceSummary.objects.get_or_create(
        employee=employee, month=month, year=year
    )

    summary.present_count = qs.filter(status=Attendance.STATUS_PRESENT).count()
    summary.late_count = qs.filter(status=Attendance.STATUS_LATE).count()
    summary.leave_count = qs.filter(status=Attendance.STATUS_ON_LEAVE).count()
    summary.absent_count = qs.filter(status=Attendance.STATUS_ABSENT).count()
    summary.early_count = qs.filter(status=Attendance.STATUS_EARLY).count()
    summary.save()


@receiver(post_save, sender=Attendance)
def update_summary_on_save(sender, instance, created, **kwargs):
    summary, _ = MonthlyAttendanceSummary.objects.get_or_create(
        employee=instance.employee,
        month=instance.date.month,
        year=instance.date.year,
    )
    if created:
        if instance.status == Attendance.STATUS_PRESENT:
            summary.present_count += 1
        elif instance.status == Attendance.STATUS_LATE:
            summary.late_count += 1
        # etc...
    else:
        # For updates, you’d need to handle old vs new status
        recalc_monthly_summary(instance.employee, instance.date.month, instance.date.year)

    summary.save()


@receiver(post_delete, sender=Attendance)
def update_summary_on_delete(sender, instance, **kwargs):
    recalc_monthly_summary(instance.employee, instance.date.month, instance.date.year)
