"""
Admin configuration for accounts app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Society, Role


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for User model.
    """
    list_display = ['email', 'display_name', 'is_active', 'is_staff', 'created_at']
    list_filter = ['is_active', 'is_staff', 'created_at']
    search_fields = ['email', 'display_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('display_name', 'phone_number')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'display_name', 'password1', 'password2'),
        }),
    )


@admin.register(Society)
class SocietyAdmin(admin.ModelAdmin):
    """
    Admin interface for Society model.
    """
    list_display = ['name', 'upi_id', 'monthly_rate_per_sqft', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'upi_id']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('name',)}),
        ('Payment Details', {'fields': ('upi_id', 'payee_name', 'bank_name', 'account_number', 'ifsc')}),
        ('Billing Settings', {'fields': ('monthly_rate_per_sqft', 'late_fee_per_day', 'due_day_of_month')}),
        ('Metadata', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    """
    Admin interface for Role model.
    """
    list_display = ['user', 'society', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__email', 'society__name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('user', 'society', 'role')}),
        ('Metadata', {'fields': ('created_at',)}),
    )
    readonly_fields = ['created_at']