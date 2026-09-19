"""
URL configuration for Navya Naman Vatika Society Manager.
"""

from pathlib import Path

from django.conf import settings
from django.contrib import admin
from django.http import FileResponse, Http404
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', include('apps.common.urls')),
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.operations.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]


def _spa_index(_request):
    dist = Path(getattr(settings, 'FRONTEND_DIST', '') or '')
    index = dist / 'index.html'
    if not index.is_file():
        raise Http404('Frontend build not found. Run npm run build and set SERVE_SPA.')
    return FileResponse(index.open('rb'), content_type='text/html')


if getattr(settings, 'SERVE_SPA', False):
    dist = Path(getattr(settings, 'FRONTEND_DIST', '') or '')
    if dist.is_dir():
        urlpatterns += [
            re_path(
                r'^assets/(?P<path>.*)$',
                serve,
                {'document_root': str(dist / 'assets')},
            ),
            re_path(
                r'^favicon\.svg$',
                serve,
                {'document_root': str(dist), 'path': 'favicon.svg'},
            ),
            re_path(
                r'^(?!api/|admin/|health/|static/|media/).*$',
                _spa_index,
            ),
        ]
