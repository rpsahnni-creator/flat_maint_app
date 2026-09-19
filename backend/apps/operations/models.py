"""
Domain models for Green Valley Society Manager operations.
"""

from django.conf import settings
from django.db import models


class Unit(models.Model):
    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='units',
    )
    unit_number = models.CharField(max_length=32)
    owner_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    floor = models.IntegerField(default=0)
    area_sqft = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    resident_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resident_units',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'units'
        unique_together = [('society', 'unit_number')]
        ordering = ['unit_number']

    def __str__(self):
        return self.unit_number


class Bill(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('partial', 'Partial'),
    ]

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='bills',
    )
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='bills')
    period_month = models.PositiveSmallIntegerField()
    period_year = models.PositiveSmallIntegerField()
    base_amount = models.DecimalField(max_digits=12, decimal_places=2)
    late_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bills'
        unique_together = [('unit', 'period_month', 'period_year')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.unit.unit_number} {self.period_month}/{self.period_year}'


class Payment(models.Model):
    METHOD_CHOICES = [
        ('upi', 'UPI'),
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    ]

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='payments',
    )
    bill = models.ForeignKey(
        Bill,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
    )
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=32, choices=METHOD_CHOICES, default='upi')
    reference_no = models.CharField(max_length=128, blank=True, null=True)
    paid_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-paid_at']


class Expense(models.Model):
    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='expenses',
    )
    category = models.CharField(max_length=64)
    description = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-expense_date']


class Notice(models.Model):
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
    ]

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='notices',
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    priority = models.CharField(max_length=16, choices=PRIORITY_CHOICES, default='normal')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notices'
        ordering = ['-created_at']


class Visitor(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('checked_in', 'Checked In'),
        ('checked_out', 'Checked Out'),
        ('denied', 'Denied'),
    ]

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='visitors',
    )
    visitor_name = models.CharField(max_length=255)
    purpose = models.CharField(max_length=255, blank=True, null=True)
    host_unit = models.ForeignKey(
        Unit,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visitors',
    )
    entry_time = models.DateTimeField(null=True, blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'visitors'
        ordering = ['-created_at']


class Amenity(models.Model):
    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='amenities',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    capacity = models.PositiveIntegerField(default=1)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'amenities'
        ordering = ['name']


class Booking(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    ]

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='bookings',
    )
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE, related_name='bookings')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='bookings')
    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='confirmed')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bookings'
        ordering = ['-booking_date', '-start_time']


class SosAlert(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('resolved', 'Resolved'),
    ]

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='sos_alerts',
    )
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='sos_alerts')
    alert_type = models.CharField(max_length=64)
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'sos_alerts'
        ordering = ['-created_at']


class Complaint(models.Model):
    CATEGORY_CHOICES = [
        ('plumbing', 'Plumbing'),
        ('electrical', 'Electrical'),
        ('cleaning', 'Cleaning'),
        ('security', 'Security'),
        ('other', 'Other'),
        ('general', 'General'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='complaints',
    )
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='complaints')
    category = models.CharField(max_length=32, choices=CATEGORY_CHOICES, default='general')
    description = models.TextField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'complaints'
        ordering = ['-created_at']


class ChatThread(models.Model):
    """One gate↔owner conversation per flat unit."""

    society = models.ForeignKey(
        'accounts.Society',
        on_delete=models.CASCADE,
        related_name='chat_threads',
    )
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='chat_threads')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'chat_threads'
        unique_together = [('society', 'unit')]
        ordering = ['-updated_at']

    def __str__(self):
        return f'Chat {self.unit.unit_number}'


class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
    )
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'chat_messages'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender_id}: {self.body[:40]}'
