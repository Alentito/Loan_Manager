# app/tasks/outbox_publisher.py
import json
from datetime import datetime
from redis import Redis
from django.utils import timezone
from .models import EventOutbox
import logging

log = logging.getLogger(__name__)
r = Redis(host="127.0.0.1", port=6379, decode_responses=True)
STREAM = "events"
BATCH = 200

def publish_outbox_batch():
    events = list(EventOutbox.objects.filter(published_at__isnull=True).order_by("occurred_at")[:BATCH])
    for ev in events:
        try:
            r.xadd(STREAM, {
                "event_id": str(ev.id),
                "event_type": ev.event_type,
                "aggregate": ev.aggregate,
                "aggregate_id": str(ev.aggregate_id) if ev.aggregate_id else "",
                "tenant_id": ev.tenant_id,
                "payload": json.dumps(ev.payload),
                "version": str(ev.version),
            })
            ev.published_at = timezone.now()
            ev.publish_try = ev.publish_try + 1
            ev.save(update_fields=["published_at", "publish_try"])
            log.info("Published outbox event %s -> stream", ev.id)
        except Exception:
            ev.publish_try = ev.publish_try + 1
            ev.save(update_fields=["publish_try"])
            log.exception("Failed to publish outbox event %s", ev.id)
