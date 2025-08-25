# config/asgi.py
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# create Django ASGI app first (loads apps)
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# now import channels routing & your middleware safely
from channels.routing import ProtocolTypeRouter, URLRouter
import loan.routing
from .JWT_AuthMiddleware import JWTAuthMiddleware   # safe because apps are loaded

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddleware(
        URLRouter(loan.routing.websocket_urlpatterns)
    ),
})
