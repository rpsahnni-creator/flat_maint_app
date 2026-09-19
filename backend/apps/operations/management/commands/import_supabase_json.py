"""
Import a Supabase-style JSON dump into Django/Postgres.

Expected input (JSON):
{
  "society_settings": [{ ... }],
  "units": [...],
  "bills": [...],
  "payments": [...],
  "expenses": [...],
  "notices": [...],
  "visitors": [...],
  "amenities": [...],
  "bookings": [...],
  "sos_alerts": [...],
  "complaints": [...]
}

Usage:
  python manage.py import_supabase_json path/to/export.json
"""

import json
from decimal import Decimal
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_date, parse_datetime

from apps.accounts.models import Society
from apps.operations.models import (
    Amenity,
    Bill,
    Booking,
    Complaint,
    Expense,
    Notice,
    Payment,
    SosAlert,
    Unit,
    Visitor,
)


def _d(v, default='0'):
    if v is None or v == '':
        return Decimal(default)
    return Decimal(str(v))


class Command(BaseCommand):
    help = 'Import Supabase JSON export into local PostgreSQL models'

    def add_arguments(self, parser):
        parser.add_argument('json_path', type=str)

    @transaction.atomic
    def handle(self, *args, **options):
        path = Path(options['json_path'])
        if not path.exists():
            raise CommandError(f'File not found: {path}')

        payload = json.loads(path.read_text(encoding='utf-8'))
        settings_rows = payload.get('society_settings') or []
        if settings_rows:
            row = settings_rows[0]
            society, _ = Society.objects.update_or_create(
                name=row.get('name') or row.get('society_name') or 'Imported Society',
                defaults={
                    'upi_id': row.get('upi_id', ''),
                    'payee_name': row.get('payee_name') or row.get('name') or '',
                    'bank_name': row.get('bank_name', ''),
                    'account_number': row.get('account_number', ''),
                    'ifsc': row.get('ifsc') or row.get('ifsc_code') or '',
                    'monthly_rate_per_sqft': _d(row.get('monthly_rate_per_sqft') or row.get('billing_rate'), '3'),
                    'late_fee_per_day': _d(row.get('late_fee_per_day'), '5'),
                    'due_day_of_month': int(row.get('due_day_of_month') or row.get('due_day') or 10),
                },
            )
        else:
            society = Society.objects.first()
            if not society:
                raise CommandError('No society_settings in file and no society in DB')

        unit_map = {}
        for row in payload.get('units') or []:
            unit, _ = Unit.objects.update_or_create(
                society=society,
                unit_number=row['unit_number'],
                defaults={
                    'owner_name': row.get('owner_name', ''),
                    'phone': row.get('phone') or row.get('contact'),
                    'floor': int(row.get('floor') or 0),
                    'area_sqft': _d(row.get('area_sqft'), '0'),
                    'is_active': bool(row.get('is_active', True)),
                },
            )
            unit_map[str(row.get('id'))] = unit

        amenity_map = {}
        for row in payload.get('amenities') or []:
            amenity, _ = Amenity.objects.update_or_create(
                society=society,
                name=row['name'],
                defaults={
                    'description': row.get('description'),
                    'capacity': int(row.get('capacity') or 1),
                    'hourly_rate': _d(row.get('hourly_rate'), '0'),
                    'is_active': bool(row.get('is_active', True)),
                },
            )
            amenity_map[str(row.get('id'))] = amenity

        for row in payload.get('bills') or []:
            unit = unit_map.get(str(row.get('unit_id')))
            if not unit:
                continue
            Bill.objects.update_or_create(
                unit=unit,
                period_month=int(row['period_month']),
                period_year=int(row['period_year']),
                defaults={
                    'society': society,
                    'base_amount': _d(row.get('base_amount') or row.get('total_amount')),
                    'late_fee': _d(row.get('late_fee'), '0'),
                    'total_amount': _d(row.get('total_amount')),
                    'due_date': parse_date(str(row['due_date'])[:10]),
                    'status': row.get('status', 'pending'),
                },
            )

        for row in payload.get('expenses') or []:
            Expense.objects.create(
                society=society,
                category=row.get('category', 'general'),
                description=row.get('description'),
                amount=_d(row.get('amount')),
                expense_date=parse_date(str(row['expense_date'])[:10]),
            )

        for row in payload.get('notices') or []:
            Notice.objects.create(
                society=society,
                title=row.get('title', ''),
                body=row.get('body') or row.get('content') or '',
                priority='urgent' if row.get('priority') in ('urgent', 'high') else 'normal',
            )

        self.stdout.write(self.style.SUCCESS(f'Imported into society: {society.name}'))
        self.stdout.write(f'Units mapped: {len(unit_map)}')
