from channels.generic.websocket import AsyncWebsocketConsumer
import json
from datetime import datetime
# consumers.py
import re

import logging


class LoanConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("loan_updates", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("loan_updates", self.channel_name)

    async def loan_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))


logger = logging.getLogger(__name__)

def make_group_name(prefix: str, identifier) -> str:
    """
    Build a safe channels group name:
    - allowed chars: ASCII alphanumerics, hyphen, underscore, period
    - replace any other char with '-'
    - ensure length < 100
    """
    raw = f"{identifier}"
    # replace disallowed chars with '-'
    safe_id = re.sub(r'[^0-9A-Za-z._-]', '-', raw)
    # build name with prefix (use hyphen as separator)
    if prefix:
        name = f"{prefix}-{safe_id}"
    else:
        name = safe_id
    # trim if too long
    if len(name) >= 100:
        name = name[:99]
    return name

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # always initialize attributes that disconnect() will reference
        self.group_name = None
        self.user = None

        user = self.scope.get("user")
        self.user = user

        if not user or not getattr(user, "is_authenticated", False):
            logger.info("Rejecting WS connect: unauthenticated client.")
            await self.close(code=4001)
            return

        # create a safe group name (only allowed chars)
        self.group_name = make_group_name("user", user.id)

        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info("WS accepted: user=%s joined group=%s", user.id, self.group_name)
        except Exception:
            logger.exception("Failed to accept websocket or join group for user=%s", getattr(user, "id", None))
            await self.close(code=1011)

    async def disconnect(self, close_code):
        # Only try to discard the group if we previously set it
        try:
            if self.group_name:
                await self.channel_layer.group_discard(self.group_name, self.channel_name)
                logger.info("WS disconnect: removed channel from %s", self.group_name)
        except Exception:
            logger.exception("Error during group_discard in disconnect()")

    async def send_notification(self, event):
        try:
            await self.send(text_data=json.dumps(event["message"]))
        except Exception:
            logger.exception("Failed to send WS message to user %s", getattr(self.user, "id", None))