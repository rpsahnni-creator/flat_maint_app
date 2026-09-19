import json
import urllib.error
import urllib.request

B = 'http://127.0.0.1:8001/api/v1'


def req(method, path, token=None, body=None):
    data = None if body is None else json.dumps(body).encode()
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    request = urllib.request.Request(B + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode() or '{}')
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode() or '{}')


def as_list(payload):
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict):
        return payload.get('results', [])
    return []


_, tok = req('POST', '/auth/token/', body={'email': 'guard@greenvalley.com', 'password': 'Guard123!'})
g = tok['access']
_, units = req('GET', '/units/?is_active=true', token=g)
ul = as_list(units)
# Prefer resident-linked demo flat A-101
unit = next((u for u in ul if u.get('unit_number') == 'A-101'), ul[0])
st, th = req('POST', '/chat-threads/open/', token=g, body={'unit_id': unit['id']})
assert st == 200, th
tid = th['id']
st, _ = req(
    'POST',
    f'/chat-threads/{tid}/messages/',
    token=g,
    body={'body': f"Guest at gate for {unit['unit_number']}"},
)
assert st == 201

_, tok2 = req('POST', '/auth/token/', body={'email': 'resident@greenvalley.com', 'password': 'Resident123!'})
o = tok2['access']
st, threads = req('GET', '/chat-threads/', token=o)
assert st == 200 and len(as_list(threads)) >= 1, threads
st, msgs = req('GET', f'/chat-threads/{tid}/messages/', token=o)
assert st == 200 and isinstance(msgs, list) and len(msgs) >= 1, msgs
st, _ = req('POST', f'/chat-threads/{tid}/messages/', token=o, body={'body': 'Ok, send them up'})
assert st == 201
print('CHAT_SMOKE_OK', unit['unit_number'], 'thread', tid, 'msgs', len(msgs) + 1)
