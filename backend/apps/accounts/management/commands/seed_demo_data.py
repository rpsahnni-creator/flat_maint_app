"""
Django management command to seed demo data for development.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import Role, Society, User
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


class Command(BaseCommand):
    help = 'Seeds demo data for development and testing'

    def handle(self, *args, **options):
        self.stdout.write('Seeding demo data...')

        society, created = Society.objects.get_or_create(
            name='Navya Naman Vatika',
            defaults={
                'address': 'Bela Bagan, Deoghar',
                'upi_id': 'navyanaman@upi',
                'payee_name': 'Navya Naman Vatika',
                'bank_name': 'HDFC Bank',
                'account_number': '123456789012',
                'ifsc': 'HDFC0001234',
                'monthly_rate_per_sqft': 3.00,
                'late_fee_per_day': 5.00,
                'due_day_of_month': 10,
            },
        )
        # Rebrand any older demo society name
        Society.objects.filter(name='Green Valley Society').update(
            name='Navya Naman Vatika',
            address='Bela Bagan, Deoghar',
            payee_name='Navya Naman Vatika',
            upi_id='navyanaman@upi',
        )
        if not created:
            society.address = society.address or 'Bela Bagan, Deoghar'
            society.payee_name = 'Navya Naman Vatika'
            society.save(update_fields=['address', 'payee_name'])
        self.stdout.write(self.style.SUCCESS(f'Society: {society.name} ({society.address})'))
        self.stdout.write('AMC / Developed by: Kiji Technology')

        users_data = [
            {'email': 'admin@greenvalley.com', 'display_name': 'Super Admin', 'role': 'super_admin', 'password': 'Admin123!'},
            {'email': 'society.admin@greenvalley.com', 'display_name': 'Society Admin', 'role': 'society_admin', 'password': 'Admin123!'},
            {'email': 'accountant@greenvalley.com', 'display_name': 'Accountant', 'role': 'accountant', 'password': 'Admin123!'},
            {'email': 'manager@greenvalley.com', 'display_name': 'Manager', 'role': 'manager', 'password': 'Admin123!'},
            {'email': 'resident@greenvalley.com', 'display_name': 'John Resident', 'role': 'resident', 'password': 'Resident123!'},
        ]

        users = {}
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={'display_name': user_data['display_name'], 'is_active': True},
            )
            if created:
                user.set_password(user_data['password'])
                if user_data['role'] in ('super_admin', 'society_admin'):
                    user.is_staff = True
                if user_data['role'] == 'super_admin':
                    user.is_superuser = True
                user.save()
            Role.objects.get_or_create(
                user=user, society=society, defaults={'role': user_data['role']}
            )
            users[user_data['role']] = user
            self.stdout.write(f'User ready: {user.email}')

        unit_defs = [
            ('A-101', 'Rajesh Kumar', '9876543210', 1, 1200),
            ('A-102', 'Priya Sharma', '9876543211', 1, 1100),
            ('A-103', 'Amit Patel', '9876543212', 1, 1150),
            ('B-201', 'Sneha Gupta', '9876543213', 2, 1300),
            ('B-202', 'Vikram Singh', '9876543214', 2, 1250),
        ]
        units = []
        for number, owner, phone, floor, area in unit_defs:
            unit, _ = Unit.objects.get_or_create(
                society=society,
                unit_number=number,
                defaults={
                    'owner_name': owner,
                    'phone': phone,
                    'floor': floor,
                    'area_sqft': area,
                    'is_active': True,
                },
            )
            units.append(unit)
        units[0].resident_user = users['resident']
        units[0].owner_name = 'John Resident'
        units[0].save(update_fields=['resident_user', 'owner_name'])

        today = timezone.localdate()
        month, year = today.month, today.year
        due = date(year, month, min(10, 28))
        rate = Decimal(society.monthly_rate_per_sqft)

        for unit in units:
            base = (Decimal(unit.area_sqft) * rate).quantize(Decimal('0.01'))
            bill, created = Bill.objects.get_or_create(
                unit=unit,
                period_month=month,
                period_year=year,
                defaults={
                    'society': society,
                    'base_amount': base,
                    'late_fee': 0,
                    'total_amount': base,
                    'due_date': due,
                    'status': 'pending',
                },
            )
            if created and unit == units[0]:
                bill.status = 'paid'
                bill.save(update_fields=['status'])
                Payment.objects.get_or_create(
                    society=society,
                    bill=bill,
                    unit=unit,
                    defaults={
                        'amount': bill.total_amount,
                        'method': 'upi',
                        'reference_no': 'UPI-DEMO-1',
                        'paid_at': timezone.now() - timedelta(days=3),
                    },
                )
            if created and unit == units[2]:
                bill.status = 'overdue'
                bill.late_fee = Decimal('40.00')
                bill.total_amount = base + bill.late_fee
                bill.save(update_fields=['status', 'late_fee', 'total_amount'])

        Expense.objects.get_or_create(
            society=society,
            category='maintenance',
            expense_date=today.replace(day=min(15, 28)),
            defaults={'description': 'Lift maintenance', 'amount': Decimal('15000')},
        )
        Notice.objects.get_or_create(
            society=society,
            title='Annual General Meeting',
            defaults={
                'body': 'AGM will be held this month at 6 PM in the community hall.',
                'priority': 'urgent',
            },
        )
        hall, _ = Amenity.objects.get_or_create(
            society=society,
            name='Community Hall',
            defaults={'description': 'Event hall', 'capacity': 100, 'hourly_rate': 500, 'is_active': True},
        )
        Amenity.objects.get_or_create(
            society=society,
            name='Gym',
            defaults={'description': 'Fitness center', 'capacity': 20, 'hourly_rate': 0, 'is_active': True},
        )
        Booking.objects.get_or_create(
            society=society,
            amenity=hall,
            unit=units[0],
            booking_date=today + timedelta(days=14),
            defaults={
                'start_time': time(18, 0),
                'end_time': time(22, 0),
                'status': 'confirmed',
            },
        )
        Visitor.objects.get_or_create(
            society=society,
            visitor_name='John Doe',
            host_unit=units[0],
            defaults={
                'purpose': 'personal',
                'entry_time': timezone.now() - timedelta(hours=5),
                'exit_time': timezone.now() - timedelta(hours=3),
                'status': 'checked_out',
            },
        )
        Complaint.objects.get_or_create(
            society=society,
            unit=units[0],
            category='plumbing',
            defaults={'description': 'Water leakage in bathroom', 'status': 'open'},
        )
        SosAlert.objects.get_or_create(
            society=society,
            unit=units[0],
            alert_type='medical',
            defaults={
                'message': 'Resolved demo alert',
                'status': 'resolved',
                'resolved_at': timezone.now(),
            },
        )

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
        self.stdout.write('  Admin: admin@greenvalley.com / Admin123!')
        self.stdout.write('  Resident: resident@greenvalley.com / Resident123!')
