"""
Reconcile overdue bills (run via Task Scheduler / cron — no Docker).
"""

from django.core.management.base import BaseCommand

from apps.operations.services import reconcile_overdue_bills


class Command(BaseCommand):
    help = 'Mark pending bills past due date as overdue and accrue late fees'

    def handle(self, *args, **options):
        count = reconcile_overdue_bills()
        self.stdout.write(self.style.SUCCESS(f'Updated {count} overdue bill(s).'))
