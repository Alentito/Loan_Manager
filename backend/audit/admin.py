from django.contrib import admin
from audit.models import AuditEvent
from django.utils.html import format_html
import json


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ('changed_at', 'actor_display', 'operation', 'table_name', 'row_pk', 'diff_short')
    list_filter = ('operation', 'table_name', 'actor')
    search_fields = ('actor__username', 'row_pk', 'table_name')
    ordering = ('-changed_at',)
    readonly_fields = ('changed_at', 'actor', 'operation', 'table_name', 'row_pk', 'diff_pretty')

    def actor_display(self, obj):
        return obj.actor.username if obj.actor else "System"

    def diff_short(self, obj):
        try:
            diff = json.loads(obj.diff)
            keys = ', '.join(diff.keys())
            return f"{keys}"
        except:
            return "—"

    def diff_pretty(self, obj):
        try:
            parsed = json.loads(obj.diff)
            pretty = json.dumps(parsed, indent=2)
            return format_html(f"<pre>{pretty}</pre>")
        except Exception:
            return obj.diff
