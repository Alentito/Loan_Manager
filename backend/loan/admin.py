from django.contrib import admin

# Register your models here.
from .models import Loan,  Lender, Task, Notification,EventOutbox

admin.site.register(Loan)

admin.site.register(Lender)

admin.site.register(Task)
admin.site.register(Notification)
admin.site.register(EventOutbox)
