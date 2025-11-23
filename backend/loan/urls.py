from django.urls import path
from . import views

app_name = 'loan'

urlpatterns = [
    path('', views.loan_list, name='list'),
]
