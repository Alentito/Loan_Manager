# holidays/sync.py
from datetime import date
from models import PublicHoliday as ph
from django.db import transaction
from django.utils import timezone
from .models import PublicHoliday
from .utils import  to_cst_date

def get_us_state_holidays(years=None, state="IL", observed=True):
    """
    Return a dict-like object mapping date -> name for US holidays for given years.
    years: iterable of ints (e.g. [2024, 2025]) or None => current year
    """
    if years is None:
        years = [date.today().year]
    us_hols = {}
    for y in years:
        us = ph.US(years=[y], state=state, observed=observed)
        # us is a mapping date -> name
        # Add into us_hols (keys are datetime.date)
        us_hols.update(us)
    return us_hols

@transaction.atomic
def sync_us_holidays(years=None, state="IL", overwrite=False):
    """
    Sync US (state) holidays into PublicHoliday model.
    overwrite: if True, update existing PublicHoliday.title when source is python-holidays
    Returns: tuple (created_count, updated_count, unchanged_count)
    """
    if years is None:
        years = [date.today().year]

    us_hols = get_us_state_holidays(years=years, state=state)
    created = 0
    updated = 0
    unchanged = 0

    for hol_date, name in us_hols.items():
        # Normalize date to CST date object (no effect for naive date)
        norm_date = to_cst_date(hol_date)
        obj = PublicHoliday.objects.filter(date=norm_date).first()
        if not obj:
            PublicHoliday.objects.create(
                date=norm_date,
                title=name,
                is_public=True,
                source=f"python-holidays:US-{state}"
            )
            created += 1
        else:
            # if the existing is manual (is_public False) we should not overwrite unless explicit
            if obj.is_public and obj.title != name and overwrite:
                obj.title = name
                obj.source = f"python-holidays:US-{state}"
                obj.is_public = True
                obj.save(update_fields=["title", "source", "is_public"])
                updated += 1
            else:
                unchanged += 1

    return created, updated, unchanged
