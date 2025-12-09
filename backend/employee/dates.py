#employee/dates.py
from datetime import datetime
import pytz

CST = pytz.timezone("America/Chicago")

def get_cst_date(dt=None):
    """Return today's date in CST (or normalize a given datetime)."""
    if dt is None:
        dt = datetime.utcnow()
    return dt.astimezone(CST).date()

def is_weekend_cst(date):
    """
    Check if the given date (aware or naive) is a weekend in CST.
    Saturday = 5, Sunday = 6
    """
    if isinstance(date, datetime):
        date = date.astimezone(CST).date()
    weekday = date.weekday()  # Monday = 0 … Sunday = 6
    return weekday in (5, 6)
