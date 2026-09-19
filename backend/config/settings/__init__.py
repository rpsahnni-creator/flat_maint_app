# Django settings configuration
from .base import *  # noqa: F401, F403

# Import environment-specific settings
import os

ENV = os.environ.get('DJANGO_ENV', 'development')

if ENV == 'production':
    from .production import *  # noqa: F401, F403
elif ENV == 'test':
    from .test import *  # noqa: F401, F403
else:
    from .development import *  # noqa: F401, F403