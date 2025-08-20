from django.contrib import admin

# Register your models here.
from .models import Loan,  Lender, Task, Notification

admin.site.register(Loan)

admin.site.register(Lender)

admin.site.register(Task)
admin.site.register(Notification)
