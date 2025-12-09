# apps/audit/services.py
from django.forms.models import model_to_dict
from audit.models import AuditEvent
from audit.middleware import get_request_ctx
from django.contrib.auth import models as auth_models
from django.utils.functional import SimpleLazyObject
import json
from django.core.serializers.json import DjangoJSONEncoder
import datetime


def make_json_safe(obj):
    if hasattr(obj, "pk"):
        return obj.pk
    if isinstance(obj, dict):
        return {k: make_json_safe(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [make_json_safe(v) for v in obj]
    return obj

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
            continue
        new_val = new_data.get(field, old_val)
        if hasattr(old_val, "pk"):
            old_val = old_val.pk
        if hasattr(new_val, "pk"):
            new_val = new_val.pk
        if new_val != old_val:
            diff[field] = {"old": old_val, "new": new_val}
    return diff


def persist_event(*, instance, diff, op, actor=None, employee=None):
    """
    Persist audit event.
    Prefer explicit `actor`/`employee` passed from the view; otherwise fall back to middleware ctx.
    """
    if not diff:
        return

    # JSON-safe the diff
    safe_diff = make_json_safe(diff)
    safe_diff = json.loads(json.dumps(safe_diff, cls=DjangoJSONEncoder))

    # If actor not provided, try middleware context
    if actor is None:
        ctx = get_request_ctx()
        actor = _resolve_user(ctx.get("actor"))
        # allow middleware to send employee in ctx
        if employee is None:
            employee = ctx.get("employee")
    else:
        # caller provided actor -> unwrap SimpleLazyObject if needed
        actor = _resolve_user(actor)

    # If employee still None and actor exists, try to resolve OneToOne relation
    if employee is None and actor is not None:
        employee = getattr(actor, "employee", None)

    # Debug prints (temporary; remove in production)
    # print("AUDIT PERSIST ctx actor:", getattr(actor, "username", None), "employee:", getattr(employee, "id", None))

    AuditEvent.objects.create(
        table_name = instance._meta.db_table,
        row_pk     = str(instance.pk),
        operation  = op,
        diff       = safe_diff,
        actor      = actor,
        employee   = employee,
        remote_addr= (get_request_ctx().get("ip") if actor is None else None) or get_request_ctx().get("ip"),
        user_agent = get_request_ctx().get("ua"),
        request_id = get_request_ctx().get("request_id"),
    )