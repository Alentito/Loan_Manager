from django.shortcuts import render
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
# Create your views here.
from rest_framework.viewsets import ReadOnlyModelViewSet
from audit.models import AuditEvent
from audit.serializers import AuditEventSerializer
from rest_framework.permissions import DjangoModelPermissions


class StrictDjangoModelPermissions(DjangoModelPermissions):
    # Require view permission for GET
    perms_map = {
        'GET': ['%(app_label)s.view_%(model_name)s'],
        'OPTIONS': [],
        'HEAD': [],
        'POST': ['%(app_label)s.add_%(model_name)s'],
        'PUT': ['%(app_label)s.change_%(model_name)s'],
        'PATCH': ['%(app_label)s.change_%(model_name)s'],
        'DELETE': ['%(app_label)s.delete_%(model_name)s'],
    }

class AuditViewSet(ReadOnlyModelViewSet):         # renamed – more generic
    """
    • /api/audit/                → all audit events (every loan)
    • /api/loans/<pk>/audit/    → events for one loan
    """
    permission_classes = [StrictDjangoModelPermissions]

    serializer_class = AuditEventSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]

    # Allow filtering by model, user, or row_pk (loan ID), etc.
    filterset_fields = ['row_pk', 'table_name'] 
    search_fields = [ 'diff','operation']  # adjust as needed
    ordering_fields = ['changed_at' ]
    ordering = ['-changed_at']


    def get_queryset(self):
        qs = AuditEvent.objects.order_by("-changed_at")

        loan_pk = self.kwargs.get("loan_pk")      # present only in nested route
        if loan_pk:
            qs = qs.filter(row_pk=loan_pk)

        return qs