# backend/employee/management/commands/sync.py
from django.core.management.base import BaseCommand
from employee.sync import sync_us_holidays

class Command(BaseCommand):
    help = "Sync U.S. state holidays into PublicHoliday model"

    def add_arguments(self, parser):
        parser.add_argument("--years", nargs="+", type=int, help="Years to import, e.g. --years 2024 2025")
        parser.add_argument("--state", type=str, default="IL", help="State code (e.g. IL)")
        parser.add_argument("--overwrite", action="store_true", help="Overwrite existing public holiday titles")

    def handle(self, *args, **options):
        years = options["years"] or None
        state = options["state"]
        overwrite = options["overwrite"]
        created, updated, unchanged = sync_us_holidays(years=years, state=state, overwrite=overwrite)
        self.stdout.write(self.style.SUCCESS(
            f"Sync completed. Created: {created}, Updated: {updated}, Unchanged: {unchanged}"
        ))
