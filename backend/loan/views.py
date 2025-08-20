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


from .models import Loan, ChecklistQuestion, LoanChecklistAnswer, Lender, LoanDocStatus,Task
from .serializers import (
    LoanSerializer, ChecklistQuestionSerializer, 
     LenderSerializer, LoanDocStatusSerializer,TaskSerializer
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

def push_notification(payload: dict):

    Notification.objects.create(
            user="admin",
            title="New Loan Created",
            message=payload.get("message", "New loan created.")
        )
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "notifications",  # group name
        {
            "type": "send_notification",
            "message": payload
        }
    )
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
    
class TaskViewSet(viewsets.ModelViewSet):
    """
    Pure-DRF ViewSet:    /api/tasks/
    Use query params `?loan=<id>` and `?status=` for filtering.
    """
    serializer_class   = TaskSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    filter_backends  = [DjangoFilterBackend,
                        filters.SearchFilter,
                        filters.OrderingFilter]
    filterset_fields = ["loan", "status", "assignee"]
    search_fields    = ["title", "description"]
    ordering_fields  = ["position", "created_at", "updated_at"]
    


    def get_queryset(self):
        queryset = Task.objects.select_related("loan", "assignee")
        cmp = Task.objects.all()

        loan_id = self.kwargs.get('loan_pk')
        if loan_id:
            queryset = queryset.filter(loan_id=loan_id)
            return queryset
        else:
            return cmp
        #return queryset
    # ensure POST without ‘loan’ returns 400 (better DX)
    def perform_create(self, serializer):
     status   = serializer.validated_data.get("status")
     loan_obj = serializer.validated_data.get("loan", None)
     loan_id  = self.kwargs.get("loan_pk") or (loan_obj.id if loan_obj else None)

     if loan_id is not None:
        last_pos = (
            Task.objects
            .filter(loan_id=loan_id, status=status)
            .aggregate(Max("position"))["position__max"]
        )
        serializer.save(
            loan_id=loan_id,
            position=(last_pos or -1) + 1,
            assigner=self.request.user,
        )
     else:
            # For global tasks, just save (let position default to 0 or whatever you want)
            serializer.save(assigner=self.request.user)

    # keep your position-shifting logic
    def perform_update(self, serializer):
        old = self.get_object()
        new_status = serializer.validated_data.get("status", old.status)
        new_pos    = serializer.validated_data.get("position", old.position)

        if new_status != old.status:
            Task.objects.filter(
                loan=old.loan, status=old.status, position__gt=old.position
            ).update(position=F("position") - 1)

        Task.objects.filter(
            loan=old.loan, status=new_status, position__gte=new_pos
        ).update(position=F("position") + 1)

        serializer.save(position=new_pos, status=new_status)


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
    filterset_fields = ['milestone']
    
    search_fields = ['first_name', 'last_name', 'broker__name']

    ordering_fields = ['created_at', 'amount', 'milestone', 'first_name']  # allowed sort fields
    ordering = ['-created_at']  # default sort
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        print("SERIALIZER DATA:", serializer.data)  # <--- Add this line


        # 🔔 Push notification here
        push_loan_update({
            "type": "new_loan",
            "loan_id": serializer.data['id'],
            "message": f"New loan created: {serializer.data['first_name']} {serializer.data['last_name']}",
        })
        # ✅ Save notification in DB
        push_notification({
            "type": "new_loan",
            "message": f"New loan created: {serializer.data['first_name']} {serializer.data['last_name']}"
        })

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




class LendorViewSet(viewsets.ModelViewSet):
    queryset = Lender.objects.all()
    serializer_class = LenderSerializer
