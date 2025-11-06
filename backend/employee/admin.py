from django.contrib import admin

# Register your models here.

from .models import Broker,  LoanOfficer, Employee, Attendance, Shift, PublicHoliday, LeaveRequests, Meeting, Team, Lender, EmployeeToken, EmployeeBreak

admin.site.register(LoanOfficer)
admin.site.register(Broker)
admin.site.register(Employee)
admin.site.register(Attendance)
admin.site.register(Shift)
admin.site.register(PublicHoliday)
admin.site.register(LeaveRequests)
admin.site.register(Meeting)
admin.site.register(Team)
admin.site.register(Lender)
admin.site.register(EmployeeToken)
admin.site.register(EmployeeBreak)



