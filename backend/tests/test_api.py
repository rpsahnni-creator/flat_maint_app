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
    bills = gen.data['bills'] if isinstance(gen.data, dict) else gen.data
    assert len(bills) >= 1


@pytest.mark.django_db
def test_guard_sees_all_units_and_can_log_visitor(society, admin_user):
    Unit.objects.create(
        society=society, unit_number='G-101', owner_name='Owner One',
        phone='9999999999', floor=1, area_sqft=1000, is_active=True,
    )
    Unit.objects.create(
        society=society, unit_number='G-102', owner_name='Owner Two',
        phone='8888888888', floor=2, area_sqft=1100, is_active=True,
    )
    guard = User.objects.create_user(email='guard@test.com', password='Guard123!Guard', display_name='Guard')
    Role.objects.create(user=guard, society=society, role='guard')

    client = APIClient()
    r = client.post('/api/v1/auth/token/', {'email': 'guard@test.com', 'password': 'Guard123!Guard'}, format='json')
    assert r.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")

    me = client.get('/api/v1/auth/me/')
    assert me.data['app_role'] == 'guard'

    units = client.get('/api/v1/units/?is_active=true')
    results = units.data['results'] if isinstance(units.data, dict) else units.data
    assert len(results) == 2

    unit_id = results[0]['id']
    vis = client.post(
        '/api/v1/visitors/',
        {'visitor_name': 'Courier', 'purpose': 'delivery', 'host_unit_id': unit_id, 'status': 'pending'},
        format='json',
    )
    assert vis.status_code == 201

    # Guard cannot create expenses
    exp = client.post(
        '/api/v1/expenses/',
        {'category': 'x', 'description': 'no', 'amount': '1', 'expense_date': '2026-01-01'},
        format='json',
    )
    assert exp.status_code == 403


@pytest.mark.django_db
def test_guard_owner_chat(society, resident_user):
    resident, unit = resident_user
    guard = User.objects.create_user(email='guard2@test.com', password='Guard123!Guard', display_name='Guard')
    Role.objects.create(user=guard, society=society, role='guard')

    g = APIClient()
    r = g.post('/api/v1/auth/token/', {'email': 'guard2@test.com', 'password': 'Guard123!Guard'}, format='json')
    g.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    opened = g.post('/api/v1/chat-threads/open/', {'unit_id': str(unit.id)}, format='json')
    assert opened.status_code == 200
    tid = opened.data['id']
    sent = g.post(f'/api/v1/chat-threads/{tid}/messages/', {'body': 'Guest at gate for you'}, format='json')
    assert sent.status_code == 201

    o = APIClient()
    r2 = o.post('/api/v1/auth/token/', {'email': 'res@test.com', 'password': 'Resident123!Res'}, format='json')
    o.credentials(HTTP_AUTHORIZATION=f"Bearer {r2.data['access']}")
    threads = o.get('/api/v1/chat-threads/')
    results = threads.data if isinstance(threads.data, list) else threads.data.get('results', [])
    assert len(results) >= 1
    msgs = o.get(f'/api/v1/chat-threads/{tid}/messages/')
    body_list = msgs.data if isinstance(msgs.data, list) else []
    assert any(m['body'] == 'Guest at gate for you' for m in body_list)
    reply = o.post(f'/api/v1/chat-threads/{tid}/messages/', {'body': 'Ok, send them up'}, format='json')
    assert reply.status_code == 201


@pytest.mark.django_db
def test_payment_creates_pdf_and_emails(admin_user, resident_user, society, settings, mailoutbox):
    from decimal import Decimal
    from datetime import date

    from apps.operations.models import Bill, Payment

    resident, unit = resident_user
    bill = Bill.objects.create(
        society=society,
        unit=unit,
        period_month=3,
        period_year=2026,
        base_amount=Decimal('3000.00'),
        late_fee=Decimal('0'),
        total_amount=Decimal('3000.00'),
        due_date=date(2026, 3, 10),
        status='pending',
    )
    client = APIClient()
    r = client.post('/api/v1/auth/token/', {'email': 'admin@test.com', 'password': 'Admin123!Admin'}, format='json')
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {r.data['access']}")
    pay = client.post(
        '/api/v1/payments/',
        {
            'unit_id': str(unit.id),
            'bill_id': str(bill.id),
            'amount': '3000.00',
            'method': 'upi',
            'reference_no': 'UTR123',
        },
        format='json',
    )
    assert pay.status_code == 201
    assert pay.data.get('email_sent') is True
    assert pay.data.get('email_to') == resident.email
    assert len(mailoutbox) == 1
    assert mailoutbox[0].to == [resident.email]
    assert mailoutbox[0].attachments
    assert mailoutbox[0].attachments[0][0].endswith('.pdf')

    pdf = client.get(f"/api/v1/payments/{pay.data['id']}/pdf/")
    assert pdf.status_code == 200
    assert pdf['Content-Type'] == 'application/pdf'
    assert pdf.content[:4] == b'%PDF'

    bill_pdf = client.get(f'/api/v1/bills/{bill.id}/pdf/')
    assert bill_pdf.status_code == 200
    assert bill_pdf.content[:4] == b'%PDF'


@pytest.mark.django_db
def test_google_demo_auth(society):
    client = APIClient()
    r = client.post('/api/v1/auth/google/', {'id_token': 'demo-google-token'}, format='json')
    assert r.status_code == 200
    assert 'access' in r.data
