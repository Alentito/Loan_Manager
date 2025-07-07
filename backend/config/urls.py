"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
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

