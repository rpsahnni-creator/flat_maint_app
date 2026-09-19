"""
Signal handlers for accounts app.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.signals import user_logged_in, user_logged_out
import logging

logger = logging.getLogger(__name__)


@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """
    Log user login events for security audit.
    """
    logger.info(
        f"User logged in: {user.email}",
        extra={
            'user_id': user.id,
            'email': user.email,
            'ip_address': request.META.get('REMOTE_ADDR') if request else None,
            'event': 'user_login'
        }
    )


@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """
    Log user logout events for security audit.
    """
    if user:
        logger.info(
            f"User logged out: {user.email}",
            extra={
                'user_id': user.id,
                'email': user.email,
                'ip_address': request.META.get('REMOTE_ADDR') if request else None,
                'event': 'user_logout'
            }
        )