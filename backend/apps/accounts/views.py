"""
Views for accounts app.
"""

from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import User, Society, Role
from .serializers import (
    UserSerializer, 
    UserMinimalSerializer, 
    SocietySerializer, 
    RoleSerializer
)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API endpoint for retrieving and updating the current user's profile.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserListView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating users (admin only).
    """
    queryset = User.objects.all()
    serializer_class = UserMinimalSerializer
    permission_classes = [permissions.IsAdminUser]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific user (admin only).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class SocietyListView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating societies.
    """
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Society.objects.filter(members__user=self.request.user).distinct()
    
    def perform_create(self, serializer):
        # Add society admin role for the creating user
        society = serializer.save()
        Role.objects.create(
            user=self.request.user,
            society=society,
            role='society_admin'
        )


class SocietyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific society.
    """
    queryset = Society.objects.all()
    serializer_class = SocietySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Society.objects.filter(members__user=self.request.user).distinct()
    
    def perform_update(self, serializer):
        society = self.get_object()
        if not self.request.user.has_society_role(society.id, 'society_admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only society admins can update society settings.")
        serializer.save()
    
    def perform_destroy(self, instance):
        if not self.request.user.has_society_role(instance.id, 'society_admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only society admins can delete a society.")
        instance.delete()


class RoleListView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating roles.
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Limit to societies where the user has membership
        return Role.objects.filter(society__members__user=self.request.user).distinct()
    
    def perform_create(self, serializer):
        # Only allow creating roles for societies where user is admin
        society = serializer.validated_data['society']
        if not self.request.user.has_society_role(society.id, 'society_admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to assign roles in this society.")
        serializer.save()


class RoleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific role.
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Role.objects.filter(society__members__user=self.request.user).distinct()
    
    def perform_update(self, serializer):
        society = serializer.instance.society
        if not self.request.user.has_society_role(society.id, 'society_admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to update roles in this society.")
        serializer.save()
    
    def perform_destroy(self, instance):
        if not self.request.user.has_society_role(instance.society_id, 'society_admin'):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete roles in this society.")
        instance.delete()