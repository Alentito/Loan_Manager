# loan/tasks.py
from celery import shared_task
from celery.utils.log import get_task_logger
from lxml import etree
from lxml.etree import XMLSyntaxError  

from django.db import IntegrityError, transaction
from django.utils import timezone

from loan.models import XMLUpload, Loan
from loan.importer import LoanImporter


logger = get_task_logger(__name__)

@shared_task
def test_task(message):
    print(f"Test task received message: {message}")
    return f"Message was: {message}"



@shared_task(bind=True,autoretry_for=(ConnectionError,),retry_backoff=30,retry_kwargs={"max_retries": 3},)
def process_xml_upload(self, upload_id: int):
    upload = XMLUpload.objects.get(id=upload_id)
    try:
        with upload.file.open("rb") as fh:
            importer = LoanImporter(fh.read())
            importer.run()
        upload.status = "processed"
        upload.error_message = None
    except Exception as exc:
        upload.status = "error"
        upload.error_message = str(exc)
        raise
    finally:
        upload.save(update_fields=["status", "error_message"])
