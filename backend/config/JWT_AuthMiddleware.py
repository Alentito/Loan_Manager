from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async

@database_sync_to_async
def get_user(validated_token):
    # Import here to avoid AppRegistryNotReady
    from django.contrib.auth import get_user_model
    try:
        user_id = validated_token["user_id"]
        return get_user_model().objects.get(id=user_id)
    except Exception:
        return AnonymousUser()

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Import here to avoid AppRegistryNotReady
        from rest_framework_simplejwt.tokens import UntypedToken
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        headers = dict(scope["headers"])
        cookies = headers.get(b"cookie", b"").decode()
        token = None
        for c in cookies.split(";"):
            if c.strip().startswith("access_token="):
                token = c.strip().split("=")[1]
        user = AnonymousUser()
        if token:
            try:
                validated_token = UntypedToken(token)
                user = await get_user(validated_token)
            except (InvalidToken, TokenError):
                pass
        scope["user"] = user
        return await super().__call__(scope, receive, send)