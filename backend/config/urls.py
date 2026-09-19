"""
URL configuration for Green Valley Society Manager.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Health check endpoint
    path('health/', include('apps.common.urls')),
    
    # API v1 endpoints
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.operations.urls')),
    
    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]