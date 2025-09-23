# userauth/authentication.py
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        # skip token endpoints
        if request.path in ["/api/token/refresh/", "/api/token/", "/api/token/obtain/"]:
            return None
        access = request.COOKIES.get("access_token")
        if not access:
            return None
        try:
            validated_token = self.get_validated_token(access)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except Exception:
            return None
