from django.shortcuts import render



# Create your views here.
from django.contrib.auth.models import Group

from rest_framework import viewsets, permissions
#from django.contrib.auth.models import Group, Permission
from .serializers import GroupSerializer, PermissionSerializer
# views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from rest_framework.views import APIView

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.middleware import csrf
from django.contrib.auth.models import Permission
#from .serializers import PermissionSerializer


from rest_framework.permissions import BasePermission



from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "groups": [g.name for g in user.groups.all()],
            "permissions": list(user.get_all_permissions()),  # e.g. ["app.view_dashboard", ...]

            # add other fields as needed
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
        res = Response({"message": "Logged out"})
        res.delete_cookie(
            key="access_token",
            path="/"
        )
        res.delete_cookie(
            key="refresh_token",
            path="/"
        )
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
                secure=False,
                samesite="Lax" ,
                max_age=15 * 60,
                path="/"
            )

            # Refresh token cookie (7 days)
            res.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="Lax" ,
                max_age=7 * 24 * 3600,
                path="/"
            )
            csrf.get_token(request)
            return res
        except Exception as e:
            print("Refresh error:", e)  # <-- Now 'e' is defined!
            return Response({'detail': 'Invalid refresh token', 'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            data = response.data
            refresh = data["refresh"]
            access = data["access"]


            print("Login for user:", request.data.get("username"))
            print("Access token:", access)
            print("Refresh token:", refresh)

            res = Response(status=status.HTTP_200_OK)
            res.set_cookie(
                key="access_token",
                value=access,
                httponly=True,
                secure=False,  # only sent over HTTPS
                samesite="Lax",  # adjust for your frontend/backend domain setup
            )
            res.set_cookie(
                key="refresh_token",
                value=refresh,
                httponly=True,
                secure=False,
                samesite="Lax",
            )
            res.data = {"message": "Login successful"}
            return res
        return response


