"""
API tests for auth and core operations.
"""

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import Role, Society, User
from apps.operations.models import Unit


@pytest.fixture
def society(db):
    return Society.objects.create(
        name='Test Society',
        upi_id='test@upi',
        payee_name='Test',
        bank_name='Bank',
        account_number='123',
        ifsc='HDFC0000001',
    )


@pytest.fixture
def admin_user(society):
    user = User.objects.create_user(email='admin@test.com', password='Admin123!Admin', display_name='Admin')
    Role.objects.create(user=user, society=society, role='society_admin')
    return user


@pytest.fixture
def resident_user(society):
    user = User.objects.create_user(email='res@test.com', password='Resident123!Res', display_name='Res')
    Role.objects.create(user=user, society=society, role='resident')
    unit = Unit.objects.create(
        society=society,
        unit_number='T-101',
        owner_name='Res',
        floor=1,
        area_sqft=1000,
        is_active=True,
        resident_user=user,
    )
    return user, unit


@pytest.mark.django_db
def test_login_and_me(admin_user):
    client = APIClient()
    r = client.post('/api/v1/auth/token/', {'email': 'admin@test.com', 'password': 'Admin123!Admin'}, format='json')
    assert r.status_code == 200
    assert 'access' in r.data
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    me = client.get('/api/v1/auth/me/')
    assert me.status_code == 200
    assert me.data['app_role'] == 'admin'


@pytest.mark.django_db
def test_otp_flow(society):
    client = APIClient()
    req = client.post('/api/v1/auth/otp/request/', {'email': 'otp@test.com'}, format='json')
    assert req.status_code == 200
    assert 'demo_code' in req.data
    ver = client.post(
        '/api/v1/auth/otp/verify/',
        {'email': 'otp@test.com', 'otp': req.data['demo_code']},
        format='json',
    )
    assert ver.status_code == 200
    assert 'access' in ver.data


@pytest.mark.django_db
def test_resident_unit_scope(resident_user, admin_user, society):
    resident, unit = resident_user
    Unit.objects.create(
        society=society,
        unit_number='T-102',
        owner_name='Other',
        floor=1,
        area_sqft=900,
        is_active=True,
    )
    client = APIClient()
    r = client.post('/api/v1/auth/token/', {'email': 'res@test.com', 'password': 'Resident123!Res'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    units = client.get('/api/v1/units/')
    assert units.status_code == 200
    results = units.data['results'] if isinstance(units.data, dict) else units.data
    assert len(results) == 1
    assert results[0]['unit_number'] == 'T-101'


@pytest.mark.django_db
def test_bill_generate_admin(admin_user, society):
    Unit.objects.create(
        society=society,
        unit_number='A-1',
        owner_name='Owner',
        floor=1,
        area_sqft=1000,
        is_active=True,
    )
    client = APIClient()
    r = client.post('/api/v1/auth/token/', {'email': 'admin@test.com', 'password': 'Admin123!Admin'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    gen = client.post('/api/v1/bills/generate/', {'period_month': 1, 'period_year': 2026}, format='json')
    assert gen.status_code == 201
    assert len(gen.data) >= 1


@pytest.mark.django_db
def test_google_demo_auth(society):
    client = APIClient()
    r = client.post('/api/v1/auth/google/', {'id_token': 'demo-google-token'}, format='json')
    assert r.status_code == 200
    assert 'access' in r.data
