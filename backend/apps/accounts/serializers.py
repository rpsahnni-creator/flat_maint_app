"""
Serializers for accounts app.
"""

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Society, Role


class SocietySerializer(serializers.ModelSerializer):
    """
    Serializer for Society model.
    """
    
    class Meta:
        model = Society
        fields = [
            'id', 'name', 'address', 'upi_id', 'payee_name', 'bank_name', 
            'account_number', 'ifsc', 'monthly_rate_per_sqft', 
            'late_fee_per_day', 'due_day_of_month', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoleSerializer(serializers.ModelSerializer):
    """
    Serializer for Role model.
    """
    society_name = serializers.CharField(source='society.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = Role
        fields = ['id', 'user', 'society', 'society_name', 'role', 'role_display', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    roles = RoleSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    app_role = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'display_name', 'phone_number', 
            'is_active', 'is_staff', 'created_at', 'updated_at',
            'last_login', 'roles', 'full_name', 'app_role',
        ]
        read_only_fields = [
            'id', 'is_active', 'is_staff', 'created_at', 
            'updated_at', 'last_login', 'roles', 'app_role',
        ]
    
    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_app_role(self, obj):
        admin_roles = {'super_admin', 'society_admin', 'accountant', 'manager'}
        roles = set(obj.roles.values_list('role', flat=True))
        if obj.is_superuser or roles & admin_roles:
            return 'admin'
        return 'resident'


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'display_name', 'phone_number', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserMinimalSerializer(serializers.ModelSerializer):
    """
    Minimal user serializer for nested representations.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'display_name', 'full_name']
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        return obj.get_full_name()