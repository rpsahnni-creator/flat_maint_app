"""
Authentication endpoints: password JWT, OTP, Google ID token, logout.
"""

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Role, Society, User


def _tokens_for(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
        'user': {
            'id': user.id,
            'email': user.email,
            'display_name': user.get_full_name(),
        },
    }


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode('utf-8')).hexdigest()


class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'detail': 'email required'}, status=400)

        # Rate limit: 5 requests / hour per email
        rl_key = f'otp_rl:{email}'
        count = cache.get(rl_key, 0)
        if count >= 5:
            return Response({'detail': 'Too many OTP requests. Try later.'}, status=429)
        cache.set(rl_key, count + 1, timeout=3600)

        otp = f'{secrets.randbelow(1_000_000):06d}'
        cache.set(
            f'otp:{email}',
            {'hash': _hash_otp(otp), 'attempts': 0, 'created': timezone.now().isoformat()},
            timeout=600,
        )

        send_mail(
            subject='Navya Naman Vatika login code',
            message=f'Your OTP is {otp}. It expires in 10 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=True,
        )

        payload = {'detail': 'OTP sent'}
        if settings.DEBUG or getattr(settings, 'AUTH_DEMO_MODE', False):
            payload['demo_code'] = otp
        return Response(payload)


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        otp = (request.data.get('otp') or '').strip()
        if not email or not otp:
            return Response({'detail': 'email and otp required'}, status=400)

        entry = cache.get(f'otp:{email}')
        if not entry:
            return Response({'detail': 'OTP expired or not found'}, status=400)
        if entry.get('attempts', 0) >= 3:
            cache.delete(f'otp:{email}')
            return Response({'detail': 'Too many attempts'}, status=400)
        if entry['hash'] != _hash_otp(otp):
            entry['attempts'] = entry.get('attempts', 0) + 1
            cache.set(f'otp:{email}', entry, timeout=600)
            return Response({'detail': 'Invalid OTP'}, status=400)

        cache.delete(f'otp:{email}')
        user, created = User.objects.get_or_create(
            email=email,
            defaults={'display_name': email.split('@')[0], 'is_active': True},
        )
        if created:
            user.set_unusable_password()
            user.save()
            society = Society.objects.first()
            if society:
                Role.objects.get_or_create(user=user, society=society, defaults={'role': 'resident'})

        return Response(_tokens_for(user))


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('id_token') or ''
        client_id = settings.GOOGLE_WEB_CLIENT_ID

        email = None
        name = ''

        if (token == 'demo-google-token' and (settings.DEBUG or getattr(settings, 'AUTH_DEMO_MODE', False))):
            email = 'demo.google@greenvalley.com'
            name = 'Google Demo'
        elif client_id and token:
            try:
                info = google_id_token.verify_oauth2_token(
                    token, google_requests.Request(), client_id
                )
                email = (info.get('email') or '').lower()
                name = info.get('name') or email.split('@')[0]
            except Exception:
                return Response({'detail': 'Invalid Google token'}, status=400)
        else:
            return Response(
                {'detail': 'Google auth not configured. Set GOOGLE_WEB_CLIENT_ID.'},
                status=501,
            )

        if not email:
            return Response({'detail': 'Email missing from Google token'}, status=400)

        user, created = User.objects.get_or_create(
            email=email,
            defaults={'display_name': name, 'is_active': True},
        )
        if created:
            user.set_unusable_password()
            user.save()
            society = Society.objects.first()
            if society:
                Role.objects.get_or_create(user=user, society=society, defaults={'role': 'resident'})

        return Response(_tokens_for(user))


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh = request.data.get('refresh')
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except Exception:
                pass
        return Response({'detail': 'Logged out'})
