import uuid, contextvars
from django.utils.deprecation import MiddlewareMixin

_request_ctx = contextvars.ContextVar("request_ctx")

def get_request_ctx():
    """Returns a dict with user / ip / ua / request_id for any code path."""
    return _request_ctx.get({})

class AuditRequestMiddleware(MiddlewareMixin):
    def process_request(self, request):
        _request_ctx.set({
            "request_id": uuid.uuid4(),
            "actor":      getattr(request, "user", None),
            "ip":         request.META.get("REMOTE_ADDR"),
            "ua":         request.META.get("HTTP_USER_AGENT", "")[:255],
        })
