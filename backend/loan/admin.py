from django.contrib import admin

# Register your models here.
from .models import Loan,   Task, Notification,EventOutbox, Milestone, IncomeAssetNote, LoanRoleAssignment

admin.site.register(Loan)



admin.site.register(Task)
admin.site.register(Notification)
admin.site.register(EventOutbox)
admin.site.register(Milestone)
admin.site.register(IncomeAssetNote)
admin.site.register(LoanRoleAssignment)


