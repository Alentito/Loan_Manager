# loans/management/commands/bulk_insert_loans.py

from django.core.management.base import BaseCommand
from loan.models import Loan
from django.db import transaction

class Command(BaseCommand):
    help = "Insert 1 million test loan records with selected fields only"

    def handle(self, *args, **options):
        total_loans = 1_000_000
        batch_size = 10000
        loans = []

        self.stdout.write("Starting bulk insert...")

        for i in range(total_loans):
            loan = Loan(
                first_name="Kishore",
                last_name="KV",
                milestone="Underwriting",
                closing_date="2025-06-27",
                lenders=[{"lender": "", "comment": ""}]
            )
            loans.append(loan)

            if len(loans) >= batch_size:
                with transaction.atomic():
                    Loan.objects.bulk_create(loans)
                loans = []
                self.stdout.write(f"Inserted {i+1} loans...")

        # Insert remaining
        if loans:
            with transaction.atomic():
                Loan.objects.bulk_create(loans)

        self.stdout.write(self.style.SUCCESS("✅ Done inserting 1 million test loans!"))
