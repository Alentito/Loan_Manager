from django.db import transaction
from lxml import etree
from django.utils import timezone
from .models import Loan
from .specs import LOAN_SPEC, BORROWER_SECTION, NAMESPACES
from .extractor import extract_single, extract_many

class LoanImporter:
    def __init__(self, xml_bytes: bytes):
        self.tree = etree.fromstring(xml_bytes)

    def run(self):
        # ---- Extract core loan data ----------------------------------------
        loan_data = extract_single(self.tree, LOAN_SPEC, namespaces=NAMESPACES)
        if not loan_data.get("external_id"):
            raise ValueError("XML import missing external_id (LoanIdentifier). Cannot import loan.")

        # ---- Extract borrowers ---------------------------------------------
        borrowers = list(extract_many(self.tree, BORROWER_SECTION, namespaces=NAMESPACES))

        # Set first_name and last_name from the first borrower
        if borrowers:
            loan_data["first_name"] = borrowers[0].get("first_name", "")
            loan_data["last_name"] = borrowers[0].get("last_name", "")
        else:
            loan_data["first_name"] = ""
            loan_data["last_name"] = ""

        # ---- Upsert into database ------------------------------------------
        with transaction.atomic():
            loan, _ = Loan.objects.update_or_create(
                external_id=loan_data["external_id"],
                defaults={
                    **loan_data,
                    "raw_xml": etree.tostring(self.tree, encoding="unicode"),
                    "imported_at": timezone.now(),
                    "import_source": "xml",
                },
            )

            # (Optional) Print for debugging
            # print(f"Imported loan {loan.external_id} for {loan.first_name} {loan.last_name}")
