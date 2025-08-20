import uuid
from django.conf import settings
from django.db import models
from django.utils import timezone


class AuditEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    table_name = models.CharField(max_length=120)
    row_pk = models.CharField(max_length=255)  # allow slightly longer PKs
    operation = models.CharField(max_length=8)  # CREATE / UPDATE / DELETE
    diff = models.JSONField()  # {field: {old, new}}

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_events"
    )

    # <-- REPLACE 'employees' with the real app label where Employee lives
    employee = models.ForeignKey(
        "employee.Employee",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_events"
    )

    remote_addr = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=256, blank=True)

    # request_id can be null if event created outside an HTTP request
    request_id = models.UUIDField(null=True, blank=True, db_index=True)

    changed_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["table_name", "row_pk"]),
            models.Index(fields=["changed_at"]),
            models.Index(fields=["actor"]),
            models.Index(fields=["employee"]),
            models.Index(fields=["request_id"]),
        ]
        ordering = ["-changed_at"]

    def __str__(self):
        actor_name = getattr(self.actor, "username", None) or "-"
        employee_name = getattr(self.employee, "name", None) or "-"
        return f"{self.operation} {self.table_name}({self.row_pk}) by {actor_name}/{employee_name} @ {self.changed_at:%Y-%m-%d %H:%M}"
