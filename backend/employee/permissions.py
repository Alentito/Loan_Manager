# broker/permissions.py

from rest_framework.permissions import BasePermission

class IsTeamManagerOrReadOnly(BasePermission):
    """
    Custom permission to only allow team managers or team leads to approve or deny leave.
    """
    def has_permission(self, request, view):
        user = request.user
        if hasattr(user, 'employee'):
            return user.employee.position in ['team_manager', 'team_lead']
        return False

class HasDesignationPermission(BasePermission):
    def __init__(self, codename):
        self.codename = codename

    def has_permission(self, request, view):
        user = request.user
        return has_permission(user, self.codename)

# broker/permissions.py
def has_permission(user, codename):
    if not user or not user.is_authenticated:
        return False
    if hasattr(user, 'employee') and user.employee.designation:
        return user.employee.designation.permissions.filter(permission__codename=codename).exists()
    return False
