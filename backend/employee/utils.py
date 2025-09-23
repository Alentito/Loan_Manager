# employee/utils.py
from datetime import timedelta
from django.utils import timezone
from zoneinfo import ZoneInfo
from django.db import transaction
from datetime import datetime, timezone as dt_timezone
from django.db.models import Sum

CST = ZoneInfo("America/Chicago")

def to_cst(value, assume_utc_for_naive=True):
    """
    Convert a datetime (naive or aware) or ISO string to CST (timezone-aware).
    Naive datetimes are assumed to be UTC by default.
    """
    if value is None:
        return None

    # Convert string input to datetime
    if isinstance(value, str):
        if value.endswith("Z"):
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        else:
            dt = datetime.fromisoformat(value)
    elif isinstance(value, datetime):
        dt = value
    else:
        raise ValueError("to_cst expects datetime/date or ISO string")

    # Handle naive datetimes
    if dt.tzinfo is None:
        if assume_utc_for_naive:
            dt = dt.replace(tzinfo=dt_timezone.utc)
        else:
            raise ValueError("Naive datetime passed, but assume_utc_for_naive=False")

    # Convert to CST
    return dt.astimezone(CST)


def to_cst_date(value, assume_utc_for_naive=True):
    """
    Convert datetime or ISO string to CST date only (no time).
    """
    return to_cst(value, assume_utc_for_naive).date()


def now_cst():
    """
    Return current datetime in CST (timezone-aware)
    """
    return datetime.now(dt_timezone.utc).astimezone(CST)

def get_candidate_shifts(employee):
    s_primary = employee.primary_shift
    s_alt = employee.alternate_shift
    shifts = []
    if s_primary:
        shifts.append(s_primary)
    if s_alt:
        shifts.append(s_alt)
    return [s for s in shifts if s is not None]

def pick_shift_for_login(employee, login_dt_cst):


    shifts = get_candidate_shifts(employee)
    if not shifts:
        return None, None, None

    # 1) check if login is inside any shift span
    for s in shifts:
        s_start, s_end = s.get_span_for_date(login_dt_cst.date(), tz=CST)
        if s_start <= login_dt_cst <= s_end:
            return s, s_start, s_end

    # 2) check previous-day span (for shifts crossing midnight whose end is after midnight)
    for s in shifts:
        # check shift that started previous day and ends today
        prev_date = login_dt_cst.date() - timedelta(days=1)
        s_start_prev, s_end_prev = s.get_span_for_date(prev_date, tz=CST)
        if s_start_prev <= login_dt_cst <= s_end_prev:
            return s, s_start_prev, s_end_prev

    # 3) fallback: choose the shift with nearest start_time (absolute difference)
    best = None
    best_diff = None
    for s in shifts:
        s_start, s_end = s.get_span_for_date(login_dt_cst.date(), tz=CST)
        diff = abs((s_start - login_dt_cst).total_seconds())
        if best is None or diff < best_diff:
            best = (s, s_start, s_end)
            best_diff = diff

    if best:
        return best
    # fallback primary
    s = employee.primary_shift or shifts[0]
    s_start, s_end = s.get_span_for_date(login_dt_cst.date(), tz=CST)
    return s, s_start, s_end

def _decide_status(shift, login_dt_cst):
    from .models import Attendance
    grace = timedelta(minutes=shift.grace_period_minutes or 0)
    s_start, _ = shift.get_span_for_date(login_dt_cst.date(), tz=CST)

    if login_dt_cst < s_start:
        return Attendance.STATUS_EARLY, 0, s_start
    elif login_dt_cst <= s_start + grace:
        return Attendance.STATUS_PRESENT, 0, s_start
    else:
        delta = login_dt_cst - s_start
        return Attendance.STATUS_LATE, int(delta.total_seconds() // 60), login_dt_cst

def today_cst():
    return datetime.now(CST).date()


@transaction.atomic
def mark_attendance_on_login(user, login_dt=None):
    from .models import Attendance

    try:
        employee = user.employee
    except Exception:
        return None

    if login_dt is None:
        login_dt = timezone.now()
    login_dt_cst = to_cst(login_dt)

    shift, shift_start, shift_end = pick_shift_for_login(employee, login_dt_cst)

    
    att_date = shift_start.date() if shift else login_dt_cst.date()

    # If attendance already exists and is leave → don’t overwrite
    attendance = Attendance.objects.filter(employee=employee, date=att_date).first()

# If approved leave (paid/unpaid), never overwrite
    if attendance and attendance.status in [Attendance.STATUS_ON_LEAVE, Attendance.STATUS_UNPAID_LEAVE]:
        return attendance  

# If was Absent (from denied leave), allow login to flip to Present/Late/Early
# (so do nothing here — let the rest of the logic update it)
    print("LOGIN DEBUG:", employee.id, login_dt_cst, shift, shift_start, shift_end)


    # Decide status
    grace = timedelta(minutes=shift.grace_period_minutes or 0)
    if login_dt_cst < shift_start:
        if employee.alternate_shift and employee.alternate_shift != shift:
            alt = employee.alternate_shift
            alt_start, alt_end = alt.get_span_for_date(login_dt_cst.date(), tz=CST)

            if alt_start <= login_dt_cst <= alt_end:
                # ✅ Use grace like normal shift
                grace = timedelta(minutes=alt.grace_period_minutes or 0)

                if login_dt_cst <= alt_start + grace:
                    status, minutes_late, counted_from = Attendance.STATUS_PRESENT, 0, alt_start
                else:
                    delta = login_dt_cst - alt_start
                    status = Attendance.STATUS_LATE
                    minutes_late = int(delta.total_seconds() // 60)
                    counted_from = login_dt_cst

                # ✅ Extend attendance to cover both shifts (alt + primary)
                combined_start = alt_start
                combined_end = max(shift_end, alt_end)
                shift_start, shift_end = combined_start, combined_end
                shift = alt 


            else:
                status, minutes_late, counted_from = Attendance.STATUS_EARLY, 0, shift_start
        else:
            status, minutes_late, counted_from = Attendance.STATUS_EARLY, 0, shift_start
    else:
        if login_dt_cst <= shift_start + grace:
            status, minutes_late, counted_from = Attendance.STATUS_PRESENT, 0, shift_start
        else:
            delta = login_dt_cst - shift_start
            status = Attendance.STATUS_LATE
            minutes_late = int(delta.total_seconds() // 60)
            counted_from = login_dt_cst

    potential_worked = max(0, int((shift_end - counted_from).total_seconds() // 60))

    # Upsert attendance
    attendance, created = Attendance.objects.get_or_create(
        employee=employee,
        date=att_date,
        defaults={
            "login_time": login_dt_cst,
            "counted_from": counted_from,
            "status": status,
            "minutes_late": minutes_late,
            "worked_minutes": potential_worked,
            "shift": shift,
        },
    )

    old_status = None if created else attendance.status

    if not created:
    # ✅ Only update if this login is EARLIER than the stored one
        if not attendance.login_time or login_dt_cst < attendance.login_time:
            attendance.login_time = login_dt_cst

            # 🔒 Don't downgrade status: keep the "best" one
            if attendance.status not in [Attendance.STATUS_PRESENT, Attendance.STATUS_EARLY]:
                attendance.status = status
                attendance.minutes_late = minutes_late

            attendance.counted_from = counted_from
            attendance.worked_minutes = potential_worked
            attendance.shift = shift
            attendance.save(update_fields=[
                "login_time",
                "counted_from",
                "status",
                "minutes_late",
                "worked_minutes",
                "shift",
                "updated_at",
        ])
    else:
        # ✅ Later logins → just update logout_time, don’t touch status
        attendance.logout_time = login_dt_cst
        attendance.updated_at = timezone.now()
        attendance.save(update_fields=["logout_time", "updated_at"])


    update_monthly_summary(attendance, old_status=old_status)
    return attendance



@transaction.atomic
def mark_attendance_on_logout(user, logout_dt=None):
    from .models import Attendance

    try:
        employee = user.employee
    except Exception:
        return None  # user has no employee profile

    if logout_dt is None:
        logout_dt = timezone.now()
    logout_dt_cst = to_cst(logout_dt)

    # Pick the same shift window as we did at login
    shift, shift_start, shift_end = pick_shift_for_login(employee, logout_dt_cst)
    att_date = shift_start.date() if shift else logout_dt_cst.date()

    # Get attendance record for this shift/date
    attendance = (
        Attendance.objects.filter(employee=employee, date=att_date)
        .order_by("-date")
        .first()
    )

    if not attendance:
        return None  # no login record exists

    # Don’t overwrite approved/denied leave
    if attendance.status in [Attendance.STATUS_ON_LEAVE, Attendance.STATUS_UNPAID_LEAVE]:
        return attendance

    # If already logged out later → don’t overwrite
    if attendance.logout_time and attendance.logout_time >= logout_dt_cst:
        return attendance

    # Calculate worked minutes (exclude breaks)
    worked = 0
    if attendance.counted_from:
        worked = int((logout_dt_cst - attendance.counted_from).total_seconds() // 60)
        worked -= attendance.total_break_minutes or 0
        if worked < 0:
            worked = 0

    old_status = attendance.status  # keep for summary update

    # Update logout details
    attendance.logout_time = logout_dt_cst
    attendance.worked_minutes = worked
    attendance.save(update_fields=["logout_time", "worked_minutes", "updated_at"])
    
    update_monthly_summary(attendance, old_status=old_status)

    return attendance


def update_monthly_summary(attendance, old_status=None):
    from .models import MonthlyAttendanceSummary, Attendance

    summary, _ = MonthlyAttendanceSummary.objects.get_or_create(
        employee=attendance.employee,
        year=attendance.date.year,
        month=attendance.date.month,
    )

    # --- Rollback old status if changed ---
    if old_status and old_status != attendance.status:
        if old_status == Attendance.STATUS_PRESENT:
            summary.present_count = max(0, summary.present_count - 1)
        elif old_status == Attendance.STATUS_LATE:
            summary.late_count = max(0, summary.late_count - 1)
        elif old_status == Attendance.STATUS_ABSENT:
            summary.absent_count = max(0, summary.absent_count - 1)
        elif old_status == Attendance.STATUS_ON_LEAVE:
            summary.leave_count = max(0, summary.leave_count - 1)
        elif old_status == Attendance.STATUS_EARLY:
            summary.early_count = max(0, summary.early_count - 1)
        elif old_status == Attendance.STATUS_UNPAID_LEAVE:
            summary.unpaid_leave_count = max(0, summary.unpaid_leave_count - 1)

    # --- Apply new status ---
    if attendance.status == Attendance.STATUS_PRESENT:
        summary.present_count += 1
    elif attendance.status == Attendance.STATUS_LATE:
        summary.late_count += 1
    elif attendance.status == Attendance.STATUS_ABSENT:
        summary.absent_count += 1
    elif attendance.status == Attendance.STATUS_ON_LEAVE:
        summary.leave_count += 1
    elif attendance.status == Attendance.STATUS_EARLY:
        summary.early_count += 1
    elif attendance.status == Attendance.STATUS_UNPAID_LEAVE:
        summary.unpaid_leave_count += 1

    # --- Recalculate total worked minutes for the month ---
    total_worked = Attendance.objects.filter(
        employee=attendance.employee,
        date__year=attendance.date.year,
        date__month=attendance.date.month
    ).aggregate(total=Sum('worked_minutes'))['total'] or 0

    summary.total_worked_minutes = total_worked

    summary.save(update_fields=[
        "present_count",
        "late_count",
        "absent_count",
        "leave_count",
        "early_count",
        "unpaid_leave_count",
        "total_worked_minutes",  # ✅ updated
        "updated_at",
    ])


@transaction.atomic
def mark_attendance_for_leave(employee, start_date, end_date, approved=True, leave_type=None):
    from .models import Attendance

    # ensure date objects
    if isinstance(start_date, datetime):
        start_date = start_date.date()
    if isinstance(end_date, datetime):
        end_date = end_date.date()

    status = (
        Attendance.STATUS_ON_LEAVE if approved and leave_type == "Paid Leave" else
        Attendance.STATUS_UNPAID_LEAVE if approved else
        Attendance.STATUS_ABSENT
    )

    for i in range((end_date - start_date).days + 1):
        cur = start_date + timedelta(days=i)
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=cur,
            defaults={
                "status": status,
                "login_time": None,
                "logout_time": None,
                "counted_from": None,
                "worked_minutes": 0,
                "shift": None,
            },
        )

        old_status = None if created else attendance.status

        if not created and attendance.status != status:
            attendance.status = status
            attendance.login_time = None
            attendance.logout_time = None
            attendance.counted_from = None
            attendance.worked_minutes = 0
            attendance.shift = None
            attendance.save(update_fields=[
                "status", "login_time", "logout_time", "counted_from",
                "worked_minutes", "shift", "updated_at"
            ])

        update_monthly_summary(attendance, old_status=old_status)

    return True

