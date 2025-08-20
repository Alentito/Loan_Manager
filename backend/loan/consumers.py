from channels.generic.websocket import AsyncWebsocketConsumer
import json
from datetime import datetime

class LoanConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("loan_updates", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("loan_updates", self.channel_name)

    async def loan_event(self, event):
        await self.send(text_data=json.dumps(event["payload"]))


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("notifications", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("notifications", self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
    "message": {
        "title": "New Loan Created",
        "content": event["message"].get("message", ""),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
}))