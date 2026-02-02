# apps/audit/services.py
from django.forms.models import model_to_dict
from audit.models import AuditEvent
from audit.middleware import get_request_ctx
# apps/audit/services.py
from django.contrib.auth import get_user_model, models as auth_models
from django.utils.functional import SimpleLazyObject
import json
from django.core.serializers.json import DjangoJSONEncoder


import datetime

def convert_datetime(obj):
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: convert_datetime(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_datetime(i) for i in obj]
    return obj


def _resolve_user(obj):
    # unwrap SimpleLazyObject
    if isinstance(obj, SimpleLazyObject):
        obj = obj._wrapped
    # accept only real, authenticated users
    if isinstance(obj, auth_models.AnonymousUser) or not getattr(obj, "is_authenticated", False):
        return None
    return obj  # actual User instance


SENSITIVE = {"password", "ssn", "token"}   # strip or hash as needed

def calc_diff(instance, new_data, fields="__all__"):
    old = model_to_dict(instance, fields=None if fields == "__all__" else fields)
    diff = {}
    for field, old_val in old.items():
        if field in SENSITIVE:
            continue                        # or hash
        new_val = new_data.get(field, old_val)
        if new_val != old_val:
            diff[field] = {"old": old_val, "new": new_val}
    return diff

def persist_event(*, instance, diff, op):
    if not diff:        # nothing changed
        return

    # 1️⃣  Make everything JSON‑serialisable (datetimes → ISO 8601 strings, Decimal → float, etc.)
    safe_diff = json.loads(json.dumps(diff, cls=DjangoJSONEncoder))

    # 2️⃣  Usual context resolution
    ctx   = get_request_ctx()
    actor = _resolve_user(ctx.get("actor"))

    # 3️⃣  Persist
    AuditEvent.objects.create(
        table_name = instance._meta.db_table,
        row_pk     = instance.pk,
        operation  = op,
        diff       = safe_diff,          # ← now guaranteed JSON‑safe
        actor      = actor,
        remote_addr= ctx.get("ip"),
        user_agent = ctx.get("ua"),
        request_id = ctx.get("request_id"),
    )

