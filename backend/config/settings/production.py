"""
Production settings for Navya Naman Vatika Society Manager.
No Docker required — Waitress (Windows) or Gunicorn (Linux) + WhiteNoise.
"""

from pathlib import Path

from .base import *  # noqa: F401, F403

DEBUG = False
AUTH_DEMO_MODE = False

# Fail fast if insecure defaults are used in production
if not SECRET_KEY or SECRET_KEY.startswith('django-insecure'):  # noqa: F405
    raise ValueError('Set a strong SECRET_KEY in the production .env before deploying.')

# Security — enable SSL flags via env when behind HTTPS reverse proxy
SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)  # noqa: F405
SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=False)  # noqa: F405
CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=False)  # noqa: F405
SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=0)  # noqa: F405
SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False)  # noqa: F405
SECURE_HSTS_PRELOAD = env.bool('SECURE_HSTS_PRELOAD', default=False)  # noqa: F405
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])  # noqa: F405

_db_options = {'connect_timeout': 10}
_sslmode = env('DB_SSLMODE', default='prefer')  # noqa: F405
if _sslmode:
    _db_options['sslmode'] = _sslmode

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('DB_NAME', default='society_manager'),  # noqa: F405
        'USER': env('DB_USER', default='postgres'),  # noqa: F405
        'PASSWORD': env('DB_PASSWORD', default=''),  # noqa: F405
        'HOST': env('DB_HOST', default='localhost'),  # noqa: F405
        'PORT': env('DB_PORT', default='5432'),  # noqa: F405
        'CONN_MAX_AGE': 600,
        'OPTIONS': _db_options,
    }
}

EMAIL_BACKEND = env(  # noqa: F405
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend',
)
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')  # noqa: F405
EMAIL_PORT = env.int('EMAIL_PORT', default=587)  # noqa: F405
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)  # noqa: F405
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')  # noqa: F405
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')  # noqa: F405
DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@navyanamanvatika.com')  # noqa: F405

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])  # noqa: F405
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])  # noqa: F405

# Built Vite app (repo root /dist) — served by Django in single-host deploy
FRONTEND_DIST = Path(env('FRONTEND_DIST', default=str(BASE_DIR.parent / 'dist')))  # noqa: F405
SERVE_SPA = env.bool('SERVE_SPA', default=True)  # noqa: F405

_logs = BASE_DIR / 'logs'  # noqa: F405
_logs.mkdir(parents=True, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': _logs / 'django.log',
            'maxBytes': 1024 * 1024 * 50,
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
]

RATELIMIT_ENABLE = True

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 10},
    },
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
