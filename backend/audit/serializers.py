# apps/audit/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from audit.models import AuditEvent
from employee.models import Employee  # adjust app name if different

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "first_name", "last_name", "display_name")

    def get_display_name(self, obj):
        # prefer first+last, fall back to username
        name = f"{obj.first_name or ''} {obj.last_name or ''}".strip()
        return name if name else obj.username


class EmployeeMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ("id", "name")


class AuditEventSerializer(serializers.ModelSerializer):
    actor = UserMinimalSerializer(read_only=True)
    employee = EmployeeMinimalSerializer(read_only=True)

    class Meta:
        model = AuditEvent
        fields = (
            "id",
            "table_name",
            "row_pk",
            "operation",
            "diff",
            "actor",
            "employee",
            "remote_addr",
            "user_agent",
            "request_id",
            "changed_at",
        )
