"""
URL configuration for common app endpoints.
"""

from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring.
    """
    return Response({
        'status': 'healthy',
        'service': 'Navya Naman Vatika Society Manager API',
        'developer': 'Kiji Technology',
        'client': 'Navya Naman Vatika, Bela Bagan, Deoghar',
        'version': '1.0.0'
    })

urlpatterns = [
    path('', health_check, name='health-check'),
]