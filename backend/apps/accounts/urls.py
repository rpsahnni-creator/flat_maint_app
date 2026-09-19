"""
URL configuration for accounts app.
"""

from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from .auth_views import EmailTokenObtainPairView
from .auth_extra_views import GoogleAuthView, LogoutView, OTPRequestView, OTPVerifyView
from . import views

urlpatterns = [
    # JWT Token endpoints
    path('auth/token/', EmailTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('auth/otp/request/', OTPRequestView.as_view(), name='otp_request'),
    path('auth/otp/verify/', OTPVerifyView.as_view(), name='otp_verify'),
    path('auth/google/', GoogleAuthView.as_view(), name='google_auth'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # User profile endpoints
    path('auth/me/', views.UserProfileView.as_view(), name='user_profile'),
    
    # User management (admin only)
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    
    # Society management
    path('societies/', views.SocietyListView.as_view(), name='society_list'),
    path('societies/<int:pk>/', views.SocietyDetailView.as_view(), name='society_detail'),
    
    # Role management
    path('roles/', views.RoleListView.as_view(), name='role_list'),
    path('roles/<int:pk>/', views.RoleDetailView.as_view(), name='role_detail'),
]