from django.contrib import admin

# Register your models here.
from .models import Broker,  LoanOfficer, Employee

admin.site.register(LoanOfficer)
admin.site.register(Broker)
admin.site.register(Employee)