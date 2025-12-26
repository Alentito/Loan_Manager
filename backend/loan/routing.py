from django.urls import re_path
from . import consumers  # 👈 We'll make this

websocket_urlpatterns = [
    re_path(r'ws/loans/$', consumers.LoanConsumer.as_asgi()),
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),

]
