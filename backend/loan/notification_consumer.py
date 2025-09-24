# app/workers/notifications_consumer.py
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

import json, time, logging
from redis import Redis
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db import transaction
from .models import Notification

log = logging.getLogger(__name__)
r = Redis(host="127.0.0.1", port=6379, decode_responses=True)

STREAM = "events"
GROUP = "notifications-v1"
CONSUMER = "worker-1"

def ensure_group():
    try:
        r.xgroup_create(STREAM, GROUP, id="0-0", mkstream=True)
    except Exception:
        pass

def resolve_recipients(event_payload: dict, event_fields: dict):
    # Basic placeholder:
    # - If payload contains "assignee_id", notify that user
    # - Else, return tenant admins / all users for tenant (implement your own logic)
    # user = self.scope.get("user")
    #print("WS connect user:", user)
    users = []
    try:
        p = json.loads(event_fields.get("payload", "{}"))
        assignee = p.get("assignee_id")
        if assignee:
            users.append(int(assignee))
        created_by = p.get("created_by")
        if created_by and created_by not in users:
            users.append(int(created_by))
        # TODO: add more logic as needed
    except Exception:
        log.exception("parse payload failed")
    return users



def run():
    ensure_group()
    ch_layer = get_channel_layer()
    print("Waiting for events...")
    while True:
        try:
            resp = r.xreadgroup(GROUP, CONSUMER, {STREAM: ">"}, count=100, block=5000)
            print("Read events:", resp)
            #user = self.scope.get("user")   
            #print("WS connect user:", user)
            if not resp:
                continue
            for stream_name, messages in resp:
                for msg_id, fields in messages:
                    print(f"Processing message {msg_id}: {fields}")
                    try:
                        payload = json.loads(fields.get("payload","{}"))
                        event_type = fields.get("event_type")
                        tenant_id = fields.get("tenant_id")
                        recipients = resolve_recipients(payload, fields)
                        print(f"Recipients for event {msg_id}: {recipients}")
                        if not recipients:
                            print(f"No recipients for event {msg_id}, acking and skipping.")
                            r.xack(STREAM, GROUP, msg_id)
                            continue

                        notif_rows = []
                        with transaction.atomic():
                            for uid in recipients:
                                print(f"Creating Notification for user {uid}")
                                n = Notification.objects.create(
                                    user_id=uid,
                                    tenant_id=tenant_id,
                                    type=event_type,
                                    title=event_type.replace("_"," "),
                                    body=payload.get("summary",""),
                                    entity_type=fields.get("aggregate"),
                                    entity_id=fields.get("aggregate_id"),
                                    data=payload
                                )
                                notif_rows.append(n)

                        # fanout via Channels using per-user groups
                        for n in notif_rows:
                            print(f"Sending notification to user-{n.user_id} via Channels")
                            async_to_sync(ch_layer.group_send)(
                                f"user-{n.user_id}",
                                {
                                    "type": "send_notification",
                                    "message": {
                                        "id": str(n.id),
                                        "type": n.type,
                                        "title": n.title,
                                        "body": n.body,
                                        "data": n.data,
                                        "entity": {"type": n.entity_type, "id": str(n.entity_id) if n.entity_id else None},
                                        "created_at": n.created_at.isoformat(),
                                    }
                                }
                            )
                        print(f"Acking message {msg_id}")
                        r.xack(STREAM, GROUP, msg_id)
                    except Exception:
                        log.exception("Failed processing message %s", msg_id)
        except Exception:
            log.exception("Consumer outer loop error, sleeping")
            time.sleep(1)

if __name__ == "__main__":
    print("Notification consumer starting...")
    run()