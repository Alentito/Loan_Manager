from rest_framework import viewsets, status,permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .pagination import CustomPageNumberPagination


# ...existing imports...
from django.db.models import Prefetch
from .models import LoanRoleAssignment


from rest_framework.permissions import IsAuthenticated
from .models import IncomeAssetNote
from .serializers import IncomeAssetNoteSerializer
from django.db import transaction

from django.db.models import Max, F, Exists, OuterRef, Q
from .models import LoanContact
from .serializers import LoanContactSerializer


from .models import Loan, ChecklistQuestion, LoanChecklistAnswer,  LoanDocStatus,Task, Employee
from .serializers import (
    LoanSerializer, ChecklistQuestionSerializer, 
      LoanDocStatusSerializer,TaskSerializer
)
from rest_framework.views import APIView

from .models import DocOrder
from .serializers import DocOrderSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics

from rest_framework import viewsets, status
from rest_framework.response import Response
from .models import XMLUpload
from .serializers import XMLUploadSerializer
from .tasks import process_xml_upload
from audit.mixins import AuditableViewSetMixin
import logging

logger = logging.getLogger(__name__)

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification


from rest_framework.permissions import DjangoModelPermissions


from rest_framework.permissions import DjangoModelPermissions

# app/services/events.py
from .models import EventOutbox



from rest_framework import viewsets
from .models import Notification
from .serializers import NotificationSerializer

from django.utils import timezone
from django.core.exceptions import FieldDoesNotExist
import logging
from django.db.models import Q

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

def _has_field(model, name):
    try:
        model._meta.get_field(name)
        return True
    except FieldDoesNotExist:
        return False


from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Milestone
from .serializers import MilestoneSerializer, MilestoneListSerializer






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


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing milestones
    """
    queryset = Milestone.objects.all()
    serializer_class = MilestoneSerializer
    pagination_class = CustomPageNumberPagination
    permission_classes = [IsAuthenticated, StrictDjangoModelPermissions]

    def check_permissions(self, request):
        """
        Custom permission check that allows superusers full access
        """
        super().check_permissions(request)
        
        # Allow superusers to bypass all permission checks
        if request.user.is_superuser:
            return
        
        # For non-superusers, check specific permissions based on action
        action_permissions = {
            'list': 'loan.view_milestone',
            'retrieve': 'loan.view_milestone',
            'create': 'loan.add_milestone', 
            'update': 'loan.change_milestone',
            'partial_update': 'loan.change_milestone',
            'destroy': 'loan.delete_milestone',
            'bulk_delete': 'loan.delete_milestone',
        }
        
        required_perm = action_permissions.get(self.action)
        if required_perm and not request.user.has_perm(required_perm):
            self.permission_denied(
                request, 
                message=f"You do not have permission to {self.action} milestones"
            )
    
    def get_queryset(self):
        """Filter milestones based on search and status"""
        queryset = Milestone.objects.all()
        
        # Search functionality
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Status filter
        status_filter = self.request.query_params.get('status', '')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('sort_order', 'name')
    
    def get_serializer_class(self):
        """Use simplified serializer for list view"""
        if self.action == 'list':
            return MilestoneListSerializer
        return MilestoneSerializer
    
    def perform_create(self, serializer):
        """Set created_by field"""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Set updated_by field"""
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Bulk delete milestones"""
        ids = request.data.get('ids', [])
        
        if not ids:
            return Response(
                {'error': 'No IDs provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check permissions - use Django's auto-generated permission
        if not request.user.has_perm('loan.delete_milestone'):
            return Response(
                {'error': 'Permission denied'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        deleted_count = Milestone.objects.filter(id__in=ids).count()
        Milestone.objects.filter(id__in=ids).delete()
        
        return Response({
            'message': f'{deleted_count} milestones deleted successfully',
            'deleted_count': deleted_count
        })
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active milestones"""
        active_milestones = Milestone.objects.filter(status='active')
        serializer = MilestoneListSerializer(active_milestones, many=True)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user_id=self.request.user.id).order_by('-created_at')




def emit_event(aggregate: str, event_type: str, tenant_id: str, payload: dict, aggregate_id=None):
    # Simple helper; ensure caller wraps in transaction.atomic when needed
    return EventOutbox.objects.create(
        aggregate=aggregate,
        aggregate_id=aggregate_id,
        event_type=event_type,
        payload=payload,
        tenant_id=tenant_id
    )



# where you keep push_loan_update / push_notification
def push_task_update(payload: dict):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "task_updates",
        {
            "type": "task.event",
            "payload": payload
        }
    )


logger = logging.getLogger(__name__)
ch = get_channel_layer()

def push_notification_minimal(payload: dict, recipients=None, tenant_id=None):
    """
    Backwards-compatible helper. Prefer writing to outbox via emit_event instead.
    payload: dict with title, message, data, type
    recipients: list of user ids (preferred). If None and tenant_id provided, broadcast to tenant group.
    """
    now = timezone.now()
    title = payload.get("title", "Notification")
    message = payload.get("message", "")

    if recipients:
        for uid in recipients:
            try:
                notif = Notification.objects.create(
                    user_id=uid,
                    tenant_id=tenant_id or "default",
                    type=payload.get("type",""),
                    title=title,
                    body=message,
                    data=payload.get("data", {})
                )
                async_to_sync(ch.group_send)(
                f"user-{uid}",
                {"type": "send_notification", "message": {
                    "id": str(notif.id),
                    "type": notif.type,
                    "title": notif.title,       # ✅ should be "New Task: <title>"
                    "body": notif.body,         # ✅ should be "Task '<title>' was created."
                    "data": notif.data,
                    "created_at": notif.created_at.isoformat()
                }}
            )


            except Exception as e:
                logger.exception("push_notification_minimal failed for user %s: %s", uid, e)
        return

    # fallback to tenant broadcast
    if tenant_id:
        try:
            async_to_sync(ch.group_send)(
                f"tenant:{tenant_id}",
                {"type":"send_notification", "message": {
                    "title": title, "body": message, "data": payload.get("data", {}), "created_at": now.isoformat()
                }}
            )
        except Exception:
            logger.exception("tenant push failed")
    else:
        logger.warning("push_notification_minimal called without recipients or tenant_id")
        
def push_loan_update(payload):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "loan_updates",
        {
            "type": "loan.event",
            "payload": payload
        }
    )


class XMLUploadViewSet(viewsets.ModelViewSet):
    queryset = XMLUpload.objects.all()
    serializer_class = XMLUploadSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        files = request.FILES.getlist('file')
        uploads = []

        for file in files:
            upload = XMLUpload.objects.create(file=file)
            uploads.append(upload)

            try:
                process_xml_upload.delay(upload.id)
            except Exception as e:
                # log and update status so frontend doesn't crash
                logger.exception("Celery dispatch failed")
                upload.status = "error"
                upload.error_message = f"Task dispatch failed: {str(e)}"
                upload.save()

        serializer = self.get_serializer(uploads, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

from rest_framework.permissions import BasePermission

class IsTaskAssigneeOrAssigner(BasePermission):
    """
    Only allow:
      - assigner (Task.assigner User FK)
      - assignee (Task.assignee Employee FK -> employee.user)
    No staff/superuser override (enforces strict visibility).
    """
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if obj.assigner_id == request.user.id:
            return True
        assignee = getattr(obj, "assignee", None)
        if assignee and getattr(assignee, "user_id", None) == request.user.id:
            return True
        return False

    
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class   = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskAssigneeOrAssigner]
    pagination_class   = None
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ["status"]   # keep simple
    search_fields      = ["title", "description"]
    ordering_fields    = ["position", "created_at", "updated_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Task.objects.none()

        qs = Task.objects.select_related("loan", "assignee__user", "assigner")

        loan_id = self.request.query_params.get("loan")
        
        # Visible only if (assigner=user) OR (assignee.employee.user=user)
        try:
            employee = Employee.objects.get(user=user)
        except Employee.DoesNotExist:
            employee = None

        visible_q = Q(assigner=user)
        if employee:
            visible_q |= Q(assignee=employee)
        qs = qs.filter(visible_q)

        # Optional narrowing filters (cannot expand visibility)
        qp = self.request.query_params
        loan_id = qp.get("loan")
        if loan_id:
            qs = qs.filter(loan_id=loan_id)
        status_val = qp.get("status")
        if status_val:
            qs = qs.filter(status=status_val)

        assignee_param = qp.get("assignee")
        if assignee_param and assignee_param.isdigit():
            qs = qs.filter(assignee_id=int(assignee_param))

        assigner_param = qp.get("assigner")
        if assigner_param and assigner_param.isdigit():
            qs = qs.filter(assigner_id=int(assigner_param))

        return qs.distinct()

    def perform_create(self, serializer):
        status_val = serializer.validated_data.get("status")
        loan_obj = serializer.validated_data.get("loan", None)
        loan_id  = self.kwargs.get("loan_pk") or (loan_obj.id if loan_obj else None)

        if loan_id is not None:
            last_pos = (
                Task.objects
                .filter(loan_id=loan_id, status=status_val)
                .aggregate(Max("position"))["position__max"]
            )
            task = serializer.save(
                loan_id=loan_id,
                position=(last_pos or -1) + 1,
                assigner=self.request.user,
            )
        else:
            task = serializer.save(assigner=self.request.user)

        # 🔹 Emit a TaskCreated event instead of LoanCreated
        with transaction.atomic():
            emit_event(
                aggregate="task",
                aggregate_id=task.id,
                event_type="TaskCreated",
                tenant_id=getattr(task, "tenant_id", "default"),
                payload={
                    "task_id": str(task.id),
                    "title": task.title,
                    "status": task.status,
                    "loan_id": str(task.loan_id) if task.loan_id else None,
                    "created_by": self.request.user.id,
                }
            )

            # 🔹 Push real-time task updates
            push_task_update({
                "type": "TaskCreated",
                "task_id": str(task.id),
                "title": task.title,
                "status": task.status,
                "loan_id": str(task.loan_id) if task.loan_id else None,
                "created_by": self.request.user.id,
                "assignee": task.assignee.id if task.assignee else None,

            })

            recipients = [self.request.user.id]
            if task.assignee:
                if getattr(task.assignee, "user_id", None):
                    recipients.append(task.assignee.user_id)

            notif_payload = {
                "task_id": str(task.id),
                "title": task.title,
                "status": task.status,
                "loan_id": str(task.loan_id) if task.loan_id else None,
                "created_by": self.request.user.id,
                "assignee": task.assignee_id,
            }

        push_notification_minimal(
            {
                "type": "TaskCreated",
                "title": f"New Task: {task.title}",
                "message": f"Task '{task.title}' was created.",
                "data": notif_payload,
            },
            recipients=recipients,
            tenant_id=getattr(task, "tenant_id", "default"),
        )



        # push notification + DB record
        # payload = {
        #     "type": "task_created",
        #     "task_id": task.id,
        #     "loan_id": getattr(task.loan, "id", None),
        #     "message": f"Task created: {task.title}"
        # }
        # push_task_update(payload)
        # push_notification({
        #     "type": "task_created",
        #     "message": payload["message"]
        # })

    def perform_update(self, serializer):
        old = self.get_object()
        old_status = old.status
        old_position = old.position
        old_title = old.title
        old_description = old.description
        old_assignee_id = getattr(old.assignee, "id", None)

        new_status = serializer.validated_data.get("status", old_status)
        new_pos    = serializer.validated_data.get("position", old_position)

        # adjust positions when moving out of old status
        if new_status != old_status:
            Task.objects.filter(
                loan=old.loan, status=old_status, position__gt=old.position
            ).update(position=F("position") - 1)

        # make space in new status
        Task.objects.filter(
            loan=old.loan, status=new_status, position__gte=new_pos
        ).update(position=F("position") + 1)

        # save and get instance
        instance = serializer.save(position=new_pos, status=new_status)

        # compute diffs to include in notification
        diffs = {}
        if old_status != instance.status:
            diffs["status"] = {"old": old_status, "new": instance.status}
        if old_position != instance.position:
            diffs["position"] = {"old": old_position, "new": instance.position}
        if old_title != instance.title:
            diffs["title"] = {"old": old_title, "new": instance.title}
        if old_description != instance.description:
            diffs["description"] = {"old": old_description, "new": instance.description}
        new_assignee_id = getattr(instance.assignee, "id", None)
        if old_assignee_id != new_assignee_id:
            diffs["assignee"] = {"old": old_assignee_id, "new": new_assignee_id}

        payload = {
            "type": "task_updated",
            "task_id": instance.id,
            "loan_id": getattr(instance.loan, "id", None),
            "diff": diffs,
            "message": f"Task updated: {instance.title}"
        }
        push_task_update(payload)
        push_notification({
            "type": "task_updated",
            "message": payload["message"]
        })

class LoanDocStatusViewSet(viewsets.ModelViewSet):
    queryset = LoanDocStatus.objects.all()
    serializer_class = LoanDocStatusSerializer
    lookup_field = 'loan' 
    


class DocOrderViewSet(viewsets.ModelViewSet):
    queryset = DocOrder.objects.all()
    serializer_class = DocOrderSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['loan']




class LoanContactViewSet(viewsets.ModelViewSet):
    queryset = LoanContact.objects.all()
    serializer_class = LoanContactSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['loan']

class LoanViewSet(AuditableViewSetMixin, viewsets.ModelViewSet):
    
    permission_classes = [StrictDjangoModelPermissions]
    queryset = Loan.objects.all()  
    serializer_class = LoanSerializer
    pagination_class = CustomPageNumberPagination
    tracked_fields = "__all__"
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = [ 'first_name', 'milestone', 'created_at', 'closing_date', 'broker' ,'is_archived']  
    search_fields = ['first_name', 'last_name', 'broker__name', 'milestone__name']
    ordering_fields = ['created_at', 'amount', 'milestone', 'first_name']  # allowed sort fields
    ordering = ['created_at']  # default sort

    # ...existing class attrs...

    def _with_role_prefetch(self, base_qs):
        return base_qs.prefetch_related(
            Prefetch(
                'role_assignments',
                queryset=LoanRoleAssignment.objects
                    .select_related('role')
                    .prefetch_related('employees')
            )
        ).select_related('broker', 'loan_officer')  # add others if they still exist


    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Loan.objects.none()

        qs = self._with_role_prefetch(Loan.objects.all())

        can_view_all = user.is_superuser or user.has_perm("loan.view_all_loans")

        # ============================
        # VISIBILITY (ONLY if needed)
        # ============================
        if not can_view_all:
            from employee.models import Employee as EmpModel
            try:
                employee = EmpModel.objects.get(user=user)
            except EmpModel.DoesNotExist:
                employee = None

            visibility_q = Q()

            if employee:
                visibility_q |= Q(role_assignments__employees=employee)

            if _has_field(Loan, "created_by"):
                visibility_q |= Q(created_by=user)

            assigner_exists = Task.objects.filter(
                loan_id=OuterRef("pk"),
                assigner_id=user.id
            )

            assignee_exists = (
                Task.objects.filter(
                    loan_id=OuterRef("pk"),
                    assignee_id=employee.id
                ) if employee else Task.objects.none()
            )

            qs = qs.annotate(
                is_assigner=Exists(assigner_exists),
                is_assignee=Exists(assignee_exists),
            ).filter(
                visibility_q | Q(is_assigner=True) | Q(is_assignee=True)
            )

        # ============================
        # ARCHIVE (everyone)
        # ============================
        include_archived = self.request.query_params.get("include_archived", "").lower()
        if include_archived != "true" and getattr(self, "action", None) not in ("archive", "unarchive"):
            qs = qs.filter(is_archived=False)

        # ============================
        # REPORT FILTERS (everyone)
        # ============================
        params = self.request.query_params

        if params.get("broker"):
            qs = qs.filter(broker_id=params["broker"])

        if params.get("loan_officer"):
            qs = qs.filter(loan_officer_id=params["loan_officer"])

        if params.get("milestone"):
            qs = qs.filter(milestone_id=params["milestone"])

        if params.get("start_date"):
            qs = qs.filter(created_at__date__gte=params["start_date"])

        if params.get("end_date"):
            qs = qs.filter(created_at__date__lte=params["end_date"])

        if params.get("team_leader"):
            qs = qs.filter(
                role_assignments__role__name__iexact="Lead",
                role_assignments__employees__id=params["team_leader"]
            )

        if params.get("processor"):
            qs = qs.filter(
                role_assignments__role__name__iexact="Processor",
                role_assignments__employees__id=params["processor"]
            )

        return qs.distinct().order_by("-created_at")

        
    @action(detail=True, methods=['post'], permission_classes=[StrictDjangoModelPermissions])
    def archive(self, request, pk=None):
        loan = self.get_object()
        loan.is_archived = True
        loan.save(update_fields=["is_archived"])
        return Response({"status": "archived"})
        
    @action(detail=True, methods=["post"], permission_classes=[StrictDjangoModelPermissions])
    def unarchive(self, request, pk=None):
        loan = self.get_object()
        loan.is_archived = False
        loan.save(update_fields=["is_archived"])
        return Response({"status": "unarchived"})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            loan = serializer.save()
            emit_event(
                aggregate="loan",
                aggregate_id=loan.id,
                event_type="LoanCreated",
                tenant_id=getattr(loan, "tenant_id", "default"),
                payload={
                    "loan_id": str(loan.id),
                    "first_name": loan.first_name,
                    "last_name": loan.last_name,
                    "created_by": request.user.id,
                }
            )
            push_loan_update({
            "type": "LoanCreated",
            "loan_id": str(loan.id),
            "first_name": loan.first_name,
            "last_name": loan.last_name,
            "created_by": request.user.id,
            
             })

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        previous_milestone = instance.milestone
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            self.perform_update(serializer)

        instance.refresh_from_db()
        new_milestone = instance.milestone

        if (
            new_milestone
            and new_milestone != previous_milestone
            and Milestone.objects.filter(name=new_milestone, notify_on_reach=True).exists()
        ):
            self._send_milestone_email(instance, previous_milestone, new_milestone)

        return Response(serializer.data)

    def _send_milestone_email(self, loan, old_milestone, new_milestone):
        milestone_obj = Milestone.objects.filter(name=new_milestone, notify_on_reach=True).first()
        if not milestone_obj:
            return

        recipients = set()
        for attr in ("broker", "loan_officer"):
            person = getattr(loan, attr, None)
            email = getattr(person, "email", None)
            if email:
                recipients.add(email)

        for attr in ("team_leader", "team_manager", "processor", "support"):
            employee = getattr(loan, attr, None)
            email = getattr(getattr(employee, "user", None), "email", None)
            if email:
                recipients.add(email)

        if not recipients:
            fallback = getattr(settings, "MILESTONE_ALERT_RECIPIENTS", [])
            recipients.update(fallback)

        if not recipients:
            return

        subject = f"Loan {loan.id} reached milestone: {new_milestone}"
        message = (
            f"Loan {loan} moved from '{old_milestone or 'N/A'}' to '{new_milestone}'.\n"
            f"Triggered by milestone setting."
        )

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=list(recipients),
            fail_silently=False,
        )

    
    
    @action(detail=False, methods=['delete'], url_path='bulk-delete')
    def bulk_delete(self, request):
        from audit.services import persist_event
        ids = request.data.get("ids", [])
        if not ids:
            return Response({"detail": "No IDs provided."}, status=status.HTTP_400_BAD_REQUEST)

        loans = Loan.objects.filter(id__in=ids)

        for loan in loans:
            # log each delete
            persist_event(
                instance=loan,
                diff={
                    field.name: {"old": getattr(loan, field.name), "new": None}
                    for field in loan._meta.fields
                },
                op="DELETE"
            )

        loans.delete()
        return Response({"status": "deleted"}, status=status.HTTP_204_NO_CONTENT)
        
    @action(detail=True, methods=["get", "put", "patch"], url_path="income-asset-note")
    def income_asset_note(self, request, pk=None):
        loan = self.get_object()
        # set created_by when first creating the row
        note, _created = IncomeAssetNote.objects.get_or_create(
            loan=loan, defaults={"created_by": request.user if request.user.is_authenticated else None}
        )

        if request.method in ("PUT", "PATCH"):
            serializer = IncomeAssetNoteSerializer(
                note, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save(updated_by=request.user if request.user.is_authenticated else None)
            return Response(serializer.data, status=status.HTTP_200_OK)

        serializer = IncomeAssetNoteSerializer(note)
        return Response(serializer.data)


class ChecklistQuestionViewSet(viewsets.ModelViewSet):
    queryset = ChecklistQuestion.objects.all().order_by('order')
    serializer_class = ChecklistQuestionSerializer
    pagination_class = None
