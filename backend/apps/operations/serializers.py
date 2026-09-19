"""
Serializers for operations domain — IDs exposed as strings for frontend compatibility.
"""

from rest_framework import serializers

from .models import (
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


class UnitSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            'id', 'unit_number', 'owner_name', 'phone',
            'floor', 'area_sqft', 'is_active', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)


class BillSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()

    class Meta:
        model = Bill
        fields = [
            'id', 'unit_id', 'period_month', 'period_year',
            'base_amount', 'late_fee', 'total_amount', 'due_date',
            'status', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)

    def get_unit_id(self, obj):
        return str(obj.unit_id)


class PaymentSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    bill_id = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'bill_id', 'unit_id', 'amount', 'method',
            'reference_no', 'paid_at', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)

    def get_bill_id(self, obj):
        return str(obj.bill_id) if obj.bill_id else None

    def get_unit_id(self, obj):
        return str(obj.unit_id)


class ExpenseSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = Expense
        fields = ['id', 'category', 'description', 'amount', 'expense_date', 'created_at']
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)


class NoticeSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = Notice
        fields = ['id', 'title', 'body', 'priority', 'created_at']
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)


class VisitorSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    host_unit_id = serializers.SerializerMethodField()

    class Meta:
        model = Visitor
        fields = [
            'id', 'visitor_name', 'purpose', 'host_unit_id',
            'entry_time', 'exit_time', 'status', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)

    def get_host_unit_id(self, obj):
        return str(obj.host_unit_id) if obj.host_unit_id else None


class AmenitySerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = Amenity
        fields = ['id', 'name', 'description', 'capacity', 'hourly_rate', 'is_active']

    def get_id(self, obj):
        return str(obj.pk)


class BookingSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    amenity_id = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'amenity_id', 'unit_id', 'booking_date',
            'start_time', 'end_time', 'status', 'created_at',
        ]
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)

    def get_amenity_id(self, obj):
        return str(obj.amenity_id)

    def get_unit_id(self, obj):
        return str(obj.unit_id)


class SosAlertSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()

    class Meta:
        model = SosAlert
        fields = [
            'id', 'unit_id', 'alert_type', 'message',
            'status', 'created_at', 'resolved_at',
        ]
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)

    def get_unit_id(self, obj):
        return str(obj.unit_id)


class ComplaintSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'unit_id', 'category', 'description',
            'status', 'created_at', 'resolved_at',
        ]
        read_only_fields = ['created_at']

    def get_id(self, obj):
        return str(obj.pk)

    def get_unit_id(self, obj):
        return str(obj.unit_id)


class SocietySettingsSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    upi_id = serializers.CharField()
    payee_name = serializers.CharField()
    bank_name = serializers.CharField()
    account_number = serializers.CharField()
    ifsc = serializers.CharField()
    monthly_rate_per_sqft = serializers.DecimalField(max_digits=10, decimal_places=2)
    late_fee_per_day = serializers.DecimalField(max_digits=10, decimal_places=2)
    due_day_of_month = serializers.IntegerField()
    created_at = serializers.DateTimeField()
