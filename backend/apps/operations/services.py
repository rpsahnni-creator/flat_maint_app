"""
Overdue bill reconciliation (server-side).
"""

from datetime import date
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone

from apps.operations.models import Bill


def reconcile_overdue_bills(society=None) -> int:
    """
    Mark pending bills past due_date as overdue and accrue late fees.
    Returns number of bills updated.
    """
    today = timezone.localdate()
    qs = Bill.objects.filter(status='pending', due_date__lt=today)
    if society is not None:
        qs = qs.filter(society=society)

    updated = 0
    for bill in qs.select_related('society'):
        late_per_day = Decimal(bill.society.late_fee_per_day)
        days_late = max(1, (today - bill.due_date).days)
        late_fee = (late_per_day * days_late).quantize(Decimal('0.01'))
        bill.late_fee = late_fee
        bill.total_amount = (Decimal(bill.base_amount) + late_fee).quantize(Decimal('0.01'))
        bill.status = 'overdue'
        bill.save(update_fields=['late_fee', 'total_amount', 'status'])
        updated += 1
    return updated
