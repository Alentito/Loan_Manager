from django.shortcuts import render
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from rest_framework import viewsets, permissions
#from django.contrib.auth.models import Group, Permission
from .serializers import GroupSerializer, PermissionSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from employee.utils import mark_attendance_on_login, mark_attendance_on_logout, mark_missing_absents
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.middleware import csrf
from django.contrib.auth.models import Permission
#from .serializers import PermissionSerializer
from employee.models import Employee

from rest_framework.permissions import BasePermission


from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            employee = Employee.objects.select_related("team", "primary_shift", "alternate_shift").get(user=user)
        except Employee.DoesNotExist:
            employee = None

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "groups": [g.name for g in user.groups.all()],
            "permissions": list(user.get_all_permissions()),
            "firstName": user.first_name,

            
            "employee": {
                    "id": employee.id if employee else None,
                    "login_id": employee.login_id if employee else None,
                    "name": employee.name if employee else None,
                    "company_email": employee.company_email if employee else None,
                    "contact_number": employee.contact_number if employee else None,
                    "team_name": employee.team.name if employee and employee.team else None,
                    "primary_shift": employee.primary_shift.name if employee and employee.primary_shift else None,
                    "alternate_shift": employee.alternate_shift.name if employee and employee.alternate_shift else None,
                } if employee else None
            })


class HasGroupPermission(BasePermission):
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        # Check if user is in required group
        required_groups = getattr(view, 'required_groups', [])
        return any(group.name in required_groups for group in request.user.groups.all())

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().select_related("content_type")
    serializer_class = PermissionSerializer
    pagination_class = None  

@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    def post(self, request):
        user = request.user
        if user.is_authenticated:
            try:
                attendance = mark_attendance_on_logout(user, logout_dt=timezone.now())
                if attendance:
                    print(f"[ATTENDANCE] user={user.username} -> logout at {attendance.logout_time}, worked={attendance.worked_minutes} mins")
            except Exception as e:
                print(f"[ERROR] mark_attendance_on_logout failed: {e}")

        res = Response({"message": "Logged out"})
        res.delete_cookie(key="access_token", path="/")
        res.delete_cookie(key="refresh_token", path="/")
        return res
    
#@method_decorator(csrf_exempt, name='dispatch')
class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]
    #authentication_classes = []
    def post(self, request, *args, **kwargs):
        
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response({"detail": "Refresh token missing myree umfi"},
                            status=status.HTTP_401_UNAUTHORIZED)

        try:
            #token = RefreshToken(refresh_token)
            #access_token = str(token.access_token)

            old_refresh = RefreshToken(refresh_token)

            # Create new access + refresh tokens
            new_access = str(old_refresh.access_token)
            #new_refresh = str(RefreshToken.for_user(old_refresh.user))

            res = Response({"message": "Token refreshed"}, status=status.HTTP_200_OK)
            # Access token cookie (15 minutes)
            res.set_cookie(
                key="access_token",
                value=new_access,
                httponly=True,
                secure=True,
                samesite="None" ,
                max_age=15 * 60,
                path="/"
            )

            # Refresh token cookie (7 days)
            res.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite="None" ,
                max_age=7 * 24 * 3600,
                path="/"
            )
            csrf_token = csrf.get_token(request)
            res.set_cookie(
                key="csrftoken",
                value=csrf_token,
                httponly=False,
                secure=True,
                samesite="None",
                path="/",
            )
            return res
        except Exception as e:
            print("Refresh error:", e)  # <-- Now 'e' is defined!
            return Response({'detail': 'Invalid refresh token', 'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

User = get_user_model()

class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            data = response.data
            refresh = data["refresh"]
            access = data["access"]
            username = request.data.get("username")

            try:
                user = User.objects.get(username=username)
                if hasattr(user, "employee") and user.employee:
                    employee = user.employee

                    # 1️⃣ Mark all missing absents for past days
                    mark_missing_absents(employee)

                    # 2️⃣ Mark today’s attendance based on login
                    attendance_today = mark_attendance_on_login(user, login_dt=timezone.now())
                    print(f"[ATTENDANCE] user={user.username} -> {attendance_today.status}")

            except Exception as e:
                print(f"[ERROR] attendance marking failed: {e}")

            # Set JWT cookies
            res = Response(status=status.HTTP_200_OK)
            res.set_cookie(
                key="access_token",
                value=access,
                httponly=True,
                secure=True,  # only sent over HTTPS
                samesite="None",  # allow cross-site cookie sending
            )
            res.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=True,
                samesite="None",
            )
            # Ensure a CSRF token exists and explicitly set it as a cookie so frontend JS can read it
            csrf_token = csrf.get_token(request)
            res.set_cookie(
                key="csrftoken",
                value=csrf_token,
                httponly=False,
                secure=True,
                samesite="None",
                path="/",
            )
            res.data = {"message": "Login successful"}
            return res

        return response
