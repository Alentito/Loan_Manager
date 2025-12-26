from django.shortcuts import render

# Create your views here.
from rest_framework.viewsets import ReadOnlyModelViewSet
from audit.models import AuditEvent
from audit.serializers import AuditEventSerializer

class AuditViewSet(ReadOnlyModelViewSet):         # renamed – more generic
    """
    • /api/audit/                → all audit events (every loan)
    • /api/loans/<pk>/audit/    → events for one loan
    """
    serializer_class = AuditEventSerializer
    

    def get_queryset(self):
        qs = AuditEvent.objects.order_by("-changed_at")

        loan_pk = self.kwargs.get("loan_pk")      # present only in nested route
        if loan_pk:
            qs = qs.filter(row_pk=loan_pk)

        return qs