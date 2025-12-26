from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

# Create your models here.
# auth/models.py
# class Profile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
    

class Permission(models.Model):
    codename = models.CharField(max_length=100, unique=True)  # e.g. "loan:create"
    name = models.CharField(max_length=250)
    resource = models.CharField(max_length=60)  # e.g. "loan"
    action = models.CharField(max_length=40)    # e.g. "create", "read", "approve"

    def __str__(self):
        return self.codename

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)  # e.g. Team Manager
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    # optional: role hierarchy
    parents = models.ManyToManyField('self', symmetrical=False, blank=True)
    sort_order = models.PositiveIntegerField(default=0)



    def __str__(self):
        return self.name
    class Meta:
        ordering = ["sort_order", "name"]


from django.contrib.auth.models import Group
class RoleMetadata(models.Model):
    group = models.OneToOneField(Group, on_delete=models.CASCADE, related_name="metadata")
    sort_order = models.PositiveIntegerField(default=0)
    assignable_on_loan = models.BooleanField(default=False)  # <--- Add this field
    

# class Employee(models.Model):
#     user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
#     employee_id = models.CharField(max_length=50, unique=True)
#     team = models.ForeignKey('Team', null=True, blank=True, on_delete=models.SET_NULL)
#     roles = models.ManyToManyField(Role, blank=True)   # allow multiple roles
#     # other HR fields...