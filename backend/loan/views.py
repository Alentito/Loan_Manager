from rest_framework import viewsets, status,permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from .pagination import CustomPageNumberPagination

from rest_framework.permissions import IsAuthenticated

from django.db import transaction

from django.db.models import Max, F
from .models import LoanContact
from .serializers import LoanContactSerializer


from .models import Loan, ChecklistQuestion, LoanChecklistAnswer, LoanDocStatus,Task, Employee
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

logger = logging.getLogger(__name__)

def _has_field(model, name):
    try:
        model._meta.get_field(name)
        return True
    except FieldDoesNotExist:
        return False


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

class IsTaskAssigneeOrAssignerOrStaff(BasePermission):
    """
    Object-level permission to allow only the assignee, assigner, or staff to access/modify the Task.
    """

    def has_object_permission(self, request, view, obj):
        # obj is a Task instance
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_staff or user.is_superuser or user.has_perm("tasks.view_all_tasks"):
            return True
        # allow if user is assignee or assigner
        if obj.assignee_id and obj.assignee_id == user.id:
            return True
        if obj.assigner_id and obj.assigner_id == user.id:
            return True
        return False

    
class TaskViewSet(viewsets.ModelViewSet):
    """
    Pure-DRF ViewSet: /api/tasks/
    Use query params `?loan=<id>` and `?status=` for filtering.
    """
    serializer_class   = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskAssigneeOrAssignerOrStaff]
    pagination_class = None

    filter_backends  = [DjangoFilterBackend,
                        filters.SearchFilter,
                        filters.OrderingFilter]
    filterset_fields = ["loan", "status", "assignee"]
    search_fields    = ["title", "description"]
    ordering_fields  = ["position", "created_at", "updated_at"]

    def get_queryset(self):
            user = self.request.user
            qs = Task.objects.select_related("loan", "assignee", "assigner")

            # nested route support / loan filter param
            loan_id = self.kwargs.get("loan_pk") or self.request.query_params.get("loan")
            if loan_id:
                qs = qs.filter(loan_id=loan_id)

            # staff / special perm sees everything
            if user and (user.is_staff or user.is_superuser or user.has_perm("tasks.view_all_tasks")):
                return qs

            # otherwise only tasks where user is assignee or assigner
            return qs.filter(Q(assignee=user) | Q(assigner=user)).distinct()

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
                recipients.append(task.assignee.id)

            notif_payload = {
            "task_id": str(task.id),
            "title": task.title,
            "status": task.status,
            "loan_id": str(task.loan_id) if task.loan_id else None,
            "created_by": self.request.user.id,
            "assignee": task.assignee.id if task.assignee else None,
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
    filterset_fields = [ 'first_name', 'milestone', 'created_at', 'closing_date', 'broker']

    
    search_fields = ['first_name', 'last_name', 'broker__name']

    ordering_fields = ['created_at', 'amount', 'milestone', 'first_name']  # allowed sort fields
    ordering = ['-created_at']  # default sort

    def get_queryset(self):
        user = self.request.user
        print (f"User: {user}, is_staff: {user.is_staff}, is_superuser: {user.is_superuser}, perms: {user.get_all_permissions()}")

        # Get the Employee instance for this user
        

        qs = Loan.objects.all()
        select_candidates = [f for f in ("broker", "loan_officer", "team_leader", "team_manager", "processor", "support") if _has_field(Loan, f)]

        # Staff/privileged users see all loans
        if user and (user.is_staff or user.is_superuser or user.has_perm("loan.view_all_loans")):
            try:
                if select_candidates:
                    qs = qs.select_related(*select_candidates)
            except Exception:
                logger.exception("select_related failed for staff path; returning base qs")
            return qs

        try:
            employee = Employee.objects.get(user=user)
            print (f"Employee found: {employee}")
        except Employee.DoesNotExist:
            return Loan.objects.none()

        # Regular users: only loans where user is assigned
        assigned_q = Q()
        if _has_field(Loan, "team_manager"):
            assigned_q |= Q(team_manager=employee)
        if _has_field(Loan, "team_leader"):
            assigned_q |= Q(team_leader=employee)
        if _has_field(Loan, "processor"):
            assigned_q |= Q(processor=employee)
        if _has_field(Loan, "support"):
            assigned_q |= Q(support=employee)

        if assigned_q == Q():
            return Loan.objects.none()

        qs = qs.filter(assigned_q).distinct()
        try:
            if select_candidates:
                qs = qs.select_related(*select_candidates)
        except Exception:
            logger.exception("select_related failed on default path; continuing without it")
        return qs

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

    @action(detail=True, methods=['get'], url_path='checklist-answers')
    def get_checklist_answers(self, request, pk=None):
        loan = self.get_object()
        answers = LoanChecklistAnswer.objects.filter(loan=loan)
        data = {str(a.question_id): a.answer for a in answers}
        return Response(data)

    @action(detail=True, methods=['patch'], url_path='checklist')
    def update_checklist(self, request, pk=None):
        from audit.services import persist_event  # Import here or top
        loan = self.get_object()
        answers = request.data.get("answers", {})
        comments = request.data.get("comments", {})

        question_ids = [int(qid) for qid in answers.keys()]
        valid_ids = set(ChecklistQuestion.objects.filter(id__in=question_ids).values_list('id', flat=True))
        invalid_ids = set(question_ids) - valid_ids

        if invalid_ids:
            return Response({"error": f"Invalid question IDs: {invalid_ids}"}, status=400)

        diffs = {}
        with transaction.atomic():
            for qid, answer in answers.items():
                question = ChecklistQuestion.objects.get(pk=qid)
                obj, created = LoanChecklistAnswer.objects.update_or_create(
                    loan=loan,
                    question=question,
                    defaults={
                        "answer": str(answer).lower() in ["true", "1", "yes"],
                        "comment": comments.get(str(qid), "")
                    }
                )

                old_answer = not created and obj.answer
                new_answer = str(answer).lower() in ["true", "1", "yes"]
                if old_answer != new_answer:
                    diffs[f"checklist_question_{qid}"] = {
                        "old": old_answer,
                        "new": new_answer
                    }

        # Record a grouped audit event for checklist updates
        if diffs:
            persist_event(
                instance=loan,
                diff=diffs,
                op="UPDATE"
            )

        return Response({"status": "Checklist updated"}, status=status.HTTP_200_OK)
    
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

class ChecklistQuestionViewSet(viewsets.ModelViewSet):
    queryset = ChecklistQuestion.objects.all().order_by('order')
    serializer_class = ChecklistQuestionSerializer
    pagination_class = None




