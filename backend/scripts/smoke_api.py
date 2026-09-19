import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient

c = APIClient()
r = c.post('/api/v1/auth/token/', {'email': 'admin@greenvalley.com', 'password': 'Admin123!'}, format='json')
assert r.status_code == 200, r.data
c.credentials(HTTP_AUTHORIZATION='Bearer ' + r.data['access'])

paths = [
    '/api/v1/units/',
    '/api/v1/bills/',
    '/api/v1/payments/',
    '/api/v1/expenses/',
    '/api/v1/notices/',
    '/api/v1/visitors/',
    '/api/v1/amenities/',
    '/api/v1/bookings/',
    '/api/v1/sos-alerts/',
    '/api/v1/complaints/',
    '/api/v1/dashboard/',
    '/api/v1/society-settings/',
    '/api/v1/auth/me/',
]
for path in paths:
    resp = c.get(path)
    print(path, resp.status_code)

me = c.get('/api/v1/auth/me/').data
print('app_role', me.get('app_role'))

c2 = APIClient()
r2 = c2.post('/api/v1/auth/token/', {'email': 'resident@greenvalley.com', 'password': 'Resident123!'}, format='json')
assert r2.status_code == 200, r2.data
c2.credentials(HTTP_AUTHORIZATION='Bearer ' + r2.data['access'])
ru = c2.get('/api/v1/units/')
data = ru.data.get('results', ru.data)
print('resident_units', ru.status_code, len(data))
print('OK_S2')
