from django.contrib import admin

# Register your models here.
from .models import Loan, Broker, Lender, Employee

admin.site.register(Loan)
admin.site.register(Broker)
admin.site.register(Lender)
admin.site.register(Employee)