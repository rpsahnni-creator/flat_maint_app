"""Live admin + owner panel smoke against local API (dummy writes)."""

import json
import sys
import urllib.error
import urllib.request
from datetime import date, timedelta

BASE = 'http://127.0.0.1:8001/api/v1'
results = []


def req(method, path, token=None, body=None, absolute=False):
    url = path if absolute else BASE + path
    data = None if body is None else json.dumps(body).encode()
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as resp:
            raw = resp.read().decode() or '{}'
            try:
                payload = json.loads(raw)
            except Exception:
                payload = raw
            return resp.status, payload
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            payload = json.loads(raw)
        except Exception:
            payload = raw
        return exc.code, payload


def ok(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS' if cond else 'FAIL'), name, detail if not cond else '')


def as_list(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        return payload.get('results', [])
    return []


def main():
    st, health = req('GET', 'http://127.0.0.1:8001/health/', absolute=True)
    ok('health', st == 200 and health.get('status') == 'healthy', str(health)[:120])

    st, tok = req('POST', '/auth/token/', body={'email': 'admin@greenvalley.com', 'password': 'Admin123!'})
    ok('admin login', st == 200 and 'access' in tok, str(st))
    admin = tok.get('access')

    st, me = req('GET', '/auth/me/', token=admin)
    ok('admin me role', st == 200 and me.get('app_role') == 'admin', str(me.get('app_role')))

    st, units = req('GET', '/units/?is_active=true', token=admin)
    unit_list = as_list(units)
    ok('admin lists all units', st == 200 and len(unit_list) >= 5, f'count={len(unit_list)}')
    unit_id = unit_list[0]['id'] if unit_list else None

    st, notice = req(
        'POST',
        '/notices/',
        token=admin,
        body={'title': 'Test Notice E2E', 'body': 'Dummy admin notice', 'priority': 'normal'},
    )
    ok('admin create notice', st in (200, 201) and notice.get('title') == 'Test Notice E2E', str(st))

    st, _exp = req(
        'POST',
        '/expenses/',
        token=admin,
        body={
            'category': 'utilities',
            'description': 'Dummy water bill',
            'amount': '2500.00',
            'expense_date': str(date.today()),
        },
    )
    ok('admin create expense', st in (200, 201), str(st))

    st, vis = req(
        'POST',
        '/visitors/',
        token=admin,
        body={
            'visitor_name': 'Ravi Dummy',
            'purpose': 'delivery',
            'host_unit_id': unit_id,
            'status': 'pending',
        },
    )
    ok('admin create visitor', st in (200, 201), f'{st} {vis}')

    st, comp = req(
        'POST',
        '/complaints/',
        token=admin,
        body={
            'unit_id': unit_id,
            'category': 'electrical',
            'description': 'Dummy fuse trip',
            'status': 'open',
        },
    )
    ok('admin create complaint', st in (200, 201), f'{st} {comp}')

    st, settings = req('GET', '/society-settings/', token=admin)
    ok('admin get settings', st == 200 and bool(settings.get('name')), str(settings)[:120])
    payload = {
        k: settings[k]
        for k in (
            'name',
            'upi_id',
            'payee_name',
            'bank_name',
            'account_number',
            'ifsc',
            'monthly_rate_per_sqft',
            'late_fee_per_day',
            'due_day_of_month',
        )
        if k in settings
    }
    payload['upi_id'] = 'navyanaman@upi'
    st, _settings2 = req('PUT', '/society-settings/', token=admin, body=payload)
    ok('admin update settings', st == 200, str(st))

    st, _bills_gen = req(
        'POST',
        '/bills/generate/',
        token=admin,
        body={'period_month': date.today().month, 'period_year': date.today().year},
    )
    ok('admin generate bills', st in (200, 201, 400), str(st))

    st, _dash = req('GET', '/dashboard/', token=admin)
    ok('admin dashboard', st == 200, str(st))

    st, tok2 = req(
        'POST',
        '/auth/token/',
        body={'email': 'resident@greenvalley.com', 'password': 'Resident123!'},
    )
    ok('owner login', st == 200 and 'access' in tok2, str(st))
    owner = tok2.get('access')

    st, me2 = req('GET', '/auth/me/', token=owner)
    ok('owner me role', st == 200 and me2.get('app_role') == 'resident', str(me2.get('app_role')))

    st, own_units = req('GET', '/units/?is_active=true', token=owner)
    own_list = as_list(own_units)
    ok(
        'owner sees only own unit',
        st == 200 and len(own_list) == 1 and own_list[0].get('unit_number') == 'A-101',
        f"count={len(own_list)} {[u.get('unit_number') for u in own_list]}",
    )
    own_unit = own_list[0]['id'] if own_list else None

    st, own_bills = req('GET', '/bills/', token=owner)
    bills = as_list(own_bills)
    ok(
        'owner bills scoped',
        st == 200 and all(b.get('unit_id') == own_unit for b in bills),
        f'n={len(bills)}',
    )

    st, _ = req(
        'POST',
        '/expenses/',
        token=owner,
        body={
            'category': 'utilities',
            'description': 'should fail',
            'amount': '1',
            'expense_date': str(date.today()),
        },
    )
    ok('owner blocked from expense create', st in (403, 401), str(st))

    st, oc = req(
        'POST',
        '/complaints/',
        token=owner,
        body={
            'unit_id': own_unit,
            'category': 'plumbing',
            'description': 'Owner dummy leak',
            'status': 'open',
        },
    )
    ok('owner create complaint', st in (200, 201), f'{st} {oc}')

    st, ov = req(
        'POST',
        '/visitors/',
        token=owner,
        body={
            'visitor_name': 'Owner Guest',
            'purpose': 'family',
            'host_unit_id': own_unit,
            'status': 'approved',
        },
    )
    ok('owner create visitor', st in (200, 201), f'{st} {ov}')

    st, _ = req('PUT', '/society-settings/', token=owner, body={'name': 'Hacked'})
    ok('owner blocked settings write', st in (403, 401, 405), str(st))

    st, _os = req('GET', '/society-settings/', token=owner)
    ok('owner can read settings', st == 200, str(st))

    st, am = req('GET', '/amenities/?is_active=true', token=owner)
    amlist = as_list(am)
    ok('owner list amenities', st == 200 and len(amlist) >= 1, f'n={len(amlist)}')
    if amlist and own_unit:
        book_date = str(date.today() + timedelta(days=20))
        st, bk = req(
            'POST',
            '/bookings/',
            token=owner,
            body={
                'amenity_id': amlist[0]['id'],
                'unit_id': own_unit,
                'booking_date': book_date,
                'start_time': '10:00:00',
                'end_time': '11:00:00',
                'status': 'confirmed',
            },
        )
        ok('owner create booking', st in (200, 201), f'{st} {bk}')

    st, sos = req(
        'POST',
        '/sos-alerts/',
        token=owner,
        body={
            'unit_id': own_unit,
            'alert_type': 'security',
            'message': 'Dummy owner SOS',
            'status': 'active',
        },
    )
    ok('owner trigger SOS', st in (200, 201), f'{st} {sos}')

    # --- Guard login ---
    st, tok3 = req(
        'POST',
        '/auth/token/',
        body={'email': 'guard@greenvalley.com', 'password': 'Guard123!'},
    )
    ok('guard login', st == 200 and 'access' in tok3, str(st))
    guard = tok3.get('access')

    st, me3 = req('GET', '/auth/me/', token=guard)
    ok('guard me role', st == 200 and me3.get('app_role') == 'guard', str(me3.get('app_role')))

    st, g_units = req('GET', '/units/?is_active=true', token=guard)
    glist = as_list(g_units)
    ok('guard sees all flats', st == 200 and len(glist) >= 5, f'count={len(glist)}')
    host = glist[1]['id'] if len(glist) > 1 else (glist[0]['id'] if glist else None)

    st, gv = req(
        'POST',
        '/visitors/',
        token=guard,
        body={
            'visitor_name': 'Gate Courier',
            'purpose': 'parcel for owner',
            'host_unit_id': host,
            'status': 'pending',
        },
    )
    ok('guard log visitor for owner', st in (200, 201), f'{st} {gv}')
    vid = gv.get('id') if isinstance(gv, dict) else None
    if vid:
        st, gv2 = req('PATCH', f'/visitors/{vid}/', token=guard, body={'status': 'checked_in', 'entry_time': date.today().isoformat() + 'T10:00:00Z'})
        ok('guard check-in visitor', st == 200, f'{st}')

    st, _ = req(
        'POST',
        '/expenses/',
        token=guard,
        body={'category': 'x', 'description': 'nope', 'amount': '1', 'expense_date': str(date.today())},
    )
    ok('guard blocked from expenses', st in (403, 401), str(st))

    st, gs = req(
        'POST',
        '/sos-alerts/',
        token=guard,
        body={'unit_id': host, 'alert_type': 'security', 'message': 'Gate SOS dummy', 'status': 'active'},
    )
    ok('guard log SOS for unit', st in (200, 201), f'{st} {gs}')

    failed = [r for r in results if not r[1]]
    print('\n=== SUMMARY ===')
    print(f'{len(results) - len(failed)}/{len(results)} passed')
    for name, _passed, detail in failed:
        print('FAIL', name, detail)
    return 1 if failed else 0


if __name__ == '__main__':
    raise SystemExit(main())
