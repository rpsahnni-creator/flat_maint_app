"""
URL routes for operations APIs.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AmenityViewSet,
    BillViewSet,
    BookingViewSet,
    ChatThreadViewSet,
    ComplaintViewSet,
    DashboardView,
    ExpenseViewSet,
    NoticeViewSet,
    PaymentViewSet,
    SettingsView,
    SosAlertViewSet,
    UnitViewSet,
    VisitorViewSet,
)

router = DefaultRouter()
router.register(r'units', UnitViewSet, basename='units')
router.register(r'bills', BillViewSet, basename='bills')
router.register(r'payments', PaymentViewSet, basename='payments')
router.register(r'expenses', ExpenseViewSet, basename='expenses')
router.register(r'notices', NoticeViewSet, basename='notices')
router.register(r'visitors', VisitorViewSet, basename='visitors')
router.register(r'amenities', AmenityViewSet, basename='amenities')
router.register(r'bookings', BookingViewSet, basename='bookings')
router.register(r'sos-alerts', SosAlertViewSet, basename='sos-alerts')
router.register(r'complaints', ComplaintViewSet, basename='complaints')
router.register(r'chat-threads', ChatThreadViewSet, basename='chat-threads')

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('society-settings/', SettingsView.as_view(), name='society-settings'),
    path('', include(router.urls)),
]
