"""
ViewSets for society operations APIs.
"""

from datetime import datetime
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

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
from apps.operations.permissions import (
    is_society_admin,
    resident_unit_ids,
    user_society_ids,
)
from apps.operations.serializers import (
    AmenitySerializer,
    BillSerializer,
    BookingSerializer,
    ComplaintSerializer,
    ExpenseSerializer,
    NoticeSerializer,
    PaymentSerializer,
    SocietySettingsSerializer,
    SosAlertSerializer,
    UnitSerializer,
    VisitorSerializer,
)
from apps.operations.services import reconcile_overdue_bills


def _primary_society(user):
    ids = user_society_ids(user)
    if not ids:
        return None
    return Society.objects.filter(id=ids[0]).first()


class SocietyScopedMixin:
    """Scopes querysets to the user's societies; residents see own unit rows."""

    society_field = 'society'
    unit_field = None  # e.g. 'unit' or 'host_unit'
    admin_write = False

    def get_society(self):
        return _primary_society(self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        society_ids = user_society_ids(self.request.user)
        qs = qs.filter(**{f'{self.society_field}_id__in': society_ids})
        if not is_society_admin(self.request.user) and self.unit_field:
            unit_ids = resident_unit_ids(self.request.user)
            qs = qs.filter(**{f'{self.unit_field}_id__in': unit_ids})
        return qs

    def perform_create(self, serializer):
        society = self.get_society()
        if society is None:
            raise PermissionError('No society membership')
        if self.admin_write and not is_society_admin(self.request.user, society.id):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Admin role required')
        serializer.save(society=society)


class UnitViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [IsAuthenticated]
    unit_field = None
    admin_write = True

    def get_queryset(self):
        qs = Unit.objects.filter(society_id__in=user_society_ids(self.request.user))
        if self.request.query_params.get('is_active') == 'true':
            qs = qs.filter(is_active=True)
        if not is_society_admin(self.request.user):
            qs = qs.filter(id__in=resident_unit_ids(self.request.user))
        return qs

    def perform_create(self, serializer):
        society = self.get_society()
        if not is_society_admin(self.request.user, society.id if society else None):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Admin role required')
        serializer.save(society=society)


class BillViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Bill.objects.select_related('unit').all()
    serializer_class = BillSerializer
    permission_classes = [IsAuthenticated]
    unit_field = 'unit'
    admin_write = True

    def create(self, request, *args, **kwargs):
        society = self.get_society()
        if not is_society_admin(request.user, society.id if society else None):
            return Response({'detail': 'Admin role required'}, status=403)
        unit_id = request.data.get('unit_id')
        unit = Unit.objects.filter(id=unit_id, society=society).first()
        if not unit:
            return Response({'detail': 'Invalid unit'}, status=400)
        bill = Bill.objects.create(
            society=society,
            unit=unit,
            period_month=int(request.data['period_month']),
            period_year=int(request.data['period_year']),
            base_amount=Decimal(str(request.data['base_amount'])),
            late_fee=Decimal(str(request.data.get('late_fee', 0))),
            total_amount=Decimal(str(request.data['total_amount'])),
            due_date=request.data['due_date'],
            status=request.data.get('status', 'pending'),
        )
        return Response(BillSerializer(bill).data, status=201)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        society = self.get_society()
        if not society or not is_society_admin(request.user, society.id):
            return Response({'detail': 'Admin role required'}, status=403)
        month = int(request.data.get('period_month', timezone.localdate().month))
        year = int(request.data.get('period_year', timezone.localdate().year))
        rate = Decimal(society.monthly_rate_per_sqft)
        due_day = min(28, max(1, int(society.due_day_of_month)))
        due_date = datetime(year, month, due_day).date()

        units = Unit.objects.filter(society=society, is_active=True)
        created = []
        for unit in units:
            if Bill.objects.filter(unit=unit, period_month=month, period_year=year).exists():
                continue
            base = (Decimal(unit.area_sqft) * rate).quantize(Decimal('0.01'))
            bill = Bill.objects.create(
                society=society,
                unit=unit,
                period_month=month,
                period_year=year,
                base_amount=base,
                late_fee=0,
                total_amount=base,
                due_date=due_date,
                status='pending',
            )
            created.append(bill)
        return Response(BillSerializer(created, many=True).data, status=201)


class PaymentViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    unit_field = 'unit'
    admin_write = True

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        society = self.get_society()
        if not society or not is_society_admin(request.user, society.id):
            return Response({'detail': 'Admin role required'}, status=403)
        unit = Unit.objects.filter(id=request.data.get('unit_id'), society=society).first()
        if not unit:
            return Response({'detail': 'Invalid unit'}, status=400)
        bill = None
        bill_id = request.data.get('bill_id')
        if bill_id:
            bill = Bill.objects.filter(id=bill_id, society=society).first()
        paid_at = request.data.get('paid_at') or timezone.now().isoformat()
        payment = Payment.objects.create(
            society=society,
            bill=bill,
            unit=unit,
            amount=Decimal(str(request.data.get('amount', 0))),
            method=request.data.get('method', 'upi'),
            reference_no=request.data.get('reference_no'),
            paid_at=paid_at,
        )
        if bill:
            paid_total = (
                Payment.objects.filter(bill=bill).aggregate(s=Sum('amount'))['s'] or Decimal('0')
            )
            if paid_total >= bill.total_amount:
                bill.status = 'paid'
            elif paid_total > 0:
                bill.status = 'partial'
            bill.save(update_fields=['status'])
        return Response(PaymentSerializer(payment).data, status=201)


class ExpenseViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    admin_write = True

    def create(self, request, *args, **kwargs):
        society = self.get_society()
        if not society or not is_society_admin(request.user, society.id):
            return Response({'detail': 'Admin role required'}, status=403)
        exp = Expense.objects.create(
            society=society,
            category=request.data.get('category', 'general'),
            description=request.data.get('description'),
            amount=Decimal(str(request.data.get('amount', 0))),
            expense_date=request.data.get('expense_date') or timezone.localdate().isoformat(),
        )
        return Response(ExpenseSerializer(exp).data, status=201)


class NoticeViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Notice.objects.all()
    serializer_class = NoticeSerializer
    permission_classes = [IsAuthenticated]
    admin_write = True

    def create(self, request, *args, **kwargs):
        society = self.get_society()
        if not society or not is_society_admin(request.user, society.id):
            return Response({'detail': 'Admin role required'}, status=403)
        notice = Notice.objects.create(
            society=society,
            title=request.data.get('title', ''),
            body=request.data.get('body', ''),
            priority=request.data.get('priority', 'normal'),
        )
        return Response(NoticeSerializer(notice).data, status=201)


class VisitorViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Visitor.objects.all()
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticated]
    unit_field = 'host_unit'

    def create(self, request, *args, **kwargs):
        society = self.get_society()
        if not society:
            return Response({'detail': 'No society'}, status=400)
        host_unit = None
        if request.data.get('host_unit_id'):
            host_unit = Unit.objects.filter(
                id=request.data['host_unit_id'], society=society
            ).first()
        visitor = Visitor.objects.create(
            society=society,
            visitor_name=request.data.get('visitor_name', ''),
            purpose=request.data.get('purpose'),
            host_unit=host_unit,
            entry_time=request.data.get('entry_time'),
            exit_time=request.data.get('exit_time'),
            status=request.data.get('status', 'pending'),
        )
        return Response(VisitorSerializer(visitor).data, status=201)


class AmenityViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
    permission_classes = [IsAuthenticated]
    admin_write = True

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('is_active') == 'true':
            qs = qs.filter(is_active=True)
        return qs


class BookingViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    unit_field = 'unit'

    def create(self, request, *args, **kwargs):
        society = self.get_society()
        amenity = Amenity.objects.filter(
            id=request.data.get('amenity_id'), society=society
        ).first()
        unit = Unit.objects.filter(id=request.data.get('unit_id'), society=society).first()
        if not amenity or not unit:
            return Response({'detail': 'Invalid amenity or unit'}, status=400)
        booking = Booking.objects.create(
            society=society,
            amenity=amenity,
            unit=unit,
            booking_date=request.data.get('booking_date'),
            start_time=request.data.get('start_time'),
            end_time=request.data.get('end_time'),
            status=request.data.get('status', 'confirmed'),
        )
        return Response(BookingSerializer(booking).data, status=201)


class SosAlertViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = SosAlert.objects.all()
    serializer_class = SosAlertSerializer
    permission_classes = [IsAuthenticated]
    unit_field = 'unit'

    def get_queryset(self):
        # Active SOS visible to all society members
        qs = SosAlert.objects.filter(society_id__in=user_society_ids(self.request.user))
        status_q = self.request.query_params.get('status')
        if status_q:
            qs = qs.filter(status=status_q)
        if not is_society_admin(self.request.user) and status_q != 'active':
            qs = qs.filter(unit_id__in=resident_unit_ids(self.request.user))
        return qs

    def create(self, request, *args, **kwargs):
        society = self.get_society()
        unit = Unit.objects.filter(id=request.data.get('unit_id'), society=society).first()
        if not unit:
            return Response({'detail': 'Invalid unit'}, status=400)
        alert = SosAlert.objects.create(
            society=society,
            unit=unit,
            alert_type=request.data.get('alert_type', 'general'),
            message=request.data.get('message'),
            status='active',
        )
        return Response(SosAlertSerializer(alert).data, status=201)


class ComplaintViewSet(SocietyScopedMixin, viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [IsAuthenticated]
    unit_field = 'unit'

    def create(self, request, *args, **kwargs):
        society = self.get_society()
        unit = Unit.objects.filter(id=request.data.get('unit_id'), society=society).first()
        if not unit:
            return Response({'detail': 'Invalid unit'}, status=400)
        complaint = Complaint.objects.create(
            society=society,
            unit=unit,
            category=request.data.get('category', 'general'),
            description=request.data.get('description', ''),
            status=request.data.get('status', 'open'),
        )
        return Response(ComplaintSerializer(complaint).data, status=201)


class SettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        society = _primary_society(request.user)
        if not society:
            return Response(None)
        data = SocietySettingsSerializer({
            'id': str(society.id),
            'name': society.name,
            'upi_id': society.upi_id,
            'payee_name': society.payee_name,
            'bank_name': society.bank_name,
            'account_number': society.account_number,
            'ifsc': society.ifsc,
            'monthly_rate_per_sqft': society.monthly_rate_per_sqft,
            'late_fee_per_day': society.late_fee_per_day,
            'due_day_of_month': society.due_day_of_month,
            'created_at': society.created_at,
        }).data
        return Response(data)

    def put(self, request):
        society = _primary_society(request.user)
        if not society or not is_society_admin(request.user, society.id):
            return Response({'detail': 'Admin role required'}, status=403)
        for field in (
            'name', 'upi_id', 'payee_name', 'bank_name', 'account_number', 'ifsc',
            'monthly_rate_per_sqft', 'late_fee_per_day', 'due_day_of_month',
        ):
            if field in request.data:
                setattr(society, field, request.data[field])
        if 'address' in request.data:
            society.address = request.data['address']
        society.save()
        return self.get(request)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        society = _primary_society(request.user)
        if not society:
            return Response({})
        reconcile_overdue_bills(society)
        now = timezone.localdate()
        bills = Bill.objects.filter(
            society=society, period_month=now.month, period_year=now.year
        )
        if not is_society_admin(request.user, society.id):
            bills = bills.filter(unit_id__in=resident_unit_ids(request.user, society.id))
        total_billed = bills.aggregate(s=Sum('total_amount'))['s'] or 0
        total_collected = bills.filter(status='paid').aggregate(s=Sum('total_amount'))['s'] or 0
        pending = bills.filter(status__in=['pending', 'overdue']).count()
        overdue = bills.filter(status='overdue').count()
        expenses = Expense.objects.filter(
            society=society,
            expense_date__month=now.month,
            expense_date__year=now.year,
        ).aggregate(s=Sum('amount'))['s'] or 0
        return Response({
            'total_billed': total_billed,
            'total_collected': total_collected,
            'pending_count': pending,
            'overdue_count': overdue,
            'total_expenses': expenses,
            'month': now.month,
            'year': now.year,
        })
