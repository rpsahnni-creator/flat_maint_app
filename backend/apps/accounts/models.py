"""
Custom User model for Green Valley Society Manager.
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class Society(models.Model):
    """
    Society model for multi-tenancy support.
    """
    
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=512, blank=True, default='')
    upi_id = models.CharField(max_length=255)
    payee_name = models.CharField(max_length=255)
    bank_name = models.CharField(max_length=255)
    account_number = models.CharField(max_length=255)
    ifsc = models.CharField(max_length=11)
    monthly_rate_per_sqft = models.DecimalField(max_digits=10, decimal_places=2, default=3.00)
    late_fee_per_day = models.DecimalField(max_digits=10, decimal_places=2, default=5.00)
    due_day_of_month = models.IntegerField(default=10)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'societies'
        verbose_name = 'Society'
        verbose_name_plural = 'Societies'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class Role(models.Model):
    """
    Role model for user-society relationships.
    """
    
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('society_admin', 'Society Admin'),
        ('accountant', 'Accountant'),
        ('manager', 'Manager'),
        ('guard', 'Gate Guard'),
        ('resident', 'Resident'),
    ]
    
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='roles')
    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name='members')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_roles'
        unique_together = ['user', 'society']
        verbose_name = 'Role'
        verbose_name_plural = 'Roles'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.society.name} ({self.get_role_display()})"


class UserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifier
    for authentication instead of username.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password.
        """
        if not email:
            raise ValueError('The Email field must be set')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with email as the primary identifier.
    """
    
    email = models.EmailField(unique=True, max_length=255)
    display_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['display_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        """Return the display name for the user."""
        return self.display_name or self.email.split('@')[0]
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.display_name or self.email.split('@')[0]
    
    def has_society_role(self, society_id, role):
        """
        Check if user has a specific role in a society.
        """
        return self.roles.filter(
            society_id=society_id,
            role=role
        ).exists()
    
    def get_society_roles(self):
        """
        Get all society roles for the user.
        """
        return self.roles.select_related('society').all()