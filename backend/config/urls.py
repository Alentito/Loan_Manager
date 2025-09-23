# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from loan.views import LoanViewSet, ChecklistQuestionViewSet,LoanContactViewSet,DocOrderViewSet, LoanDocStatusViewSet,TaskViewSet,XMLUploadViewSet
from audit.views import AuditViewSet
from django.conf import settings
from django.conf.urls.static import static


router = DefaultRouter()
router.register(r'loan', LoanViewSet, basename='loan')
router.register(r'checklist-questions', ChecklistQuestionViewSet, basename='checklist-question')
router.register(r'contacts', LoanContactViewSet)  # <-- add this
# In your main router file
router.register(r'document-orders', DocOrderViewSet)
router.register(r'loan-doc-status', LoanDocStatusViewSet, basename='loan-doc-status')

router.register(r'tasks', TaskViewSet, basename='task')

# Nested router for tasks under loans
loans_router = routers.NestedDefaultRouter(router, r'loan', lookup='loan')
loans_router.register(r'tasks', TaskViewSet, basename='loan-tasks')
loans_router.register(r'audit', AuditViewSet, basename='loan-audit')

router.register(r'xml-upload', XMLUploadViewSet, basename='xml-upload')
# project/urls.py (or where your router lives)
router.register(r"audit", AuditViewSet, basename="audit")
router.register(r"loan/(?P<loan_pk>\d+)/audit", AuditViewSet, basename="loan-audit")


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/', include(loans_router.urls)),
    path('api/', include('employee.urls')),
    # path('loan/', include('loan.urls')),
    
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

