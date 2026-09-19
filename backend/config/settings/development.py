"""
Development settings for Green Valley Society Manager.
"""

from .base import *  # noqa: F401, F403

DEBUG = True
AUTH_DEMO_MODE = True

ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1', 'testserver'])

# Database for development (PostgreSQL)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

# Email backend for development (console)
EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')

# CORS for development
CORS_ALLOW_ALL_ORIGINS = True

# Disable HTTPS requirements for development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Debug toolbar (optional)
try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS.append('debug_toolbar')  # noqa: F405
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
except ImportError:
    pass

# Detailed error messages
REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'] = [  # noqa: F405
    'rest_framework.renderers.JSONRenderer',
    'rest_framework.renderers.BrowsableAPIRenderer',
]

# Disable rate limiting in development
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []  # noqa: F405

# Logging - less verbose for faster startup
LOGGING['loggers']['django']['level'] = 'INFO'  # noqa: F405
LOGGING['loggers']['apps']['level'] = 'INFO'  # noqa: F405