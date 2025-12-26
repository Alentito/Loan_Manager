import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone

class AuditEvent(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    table_name  = models.CharField(max_length=120)
    row_pk      = models.CharField(max_length=120)
    operation   = models.CharField(max_length=8)                 # CREATE / UPDATE / DELETE
    diff        = models.JSONField()                             # {field: {old, new}}
    actor       = models.ForeignKey(settings.AUTH_USER_MODEL, null=True,
                                    on_delete=models.SET_NULL, related_name='audit_events')
    remote_addr = models.GenericIPAddressField(null=True, blank=True)
    user_agent  = models.CharField(max_length=256, blank=True)
    request_id  = models.UUIDField(db_index=True)
    changed_at  = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['table_name', 'row_pk']),
            models.Index(fields=['changed_at']),
        ]

    def __str__(self):
        return f"{self.operation} {self.table_name}({self.row_pk}) @ {self.changed_at:%Y-%m-%d %H:%M}"
