# Navya Naman Vatika — Society Manager

AMC / developed by **Kiji Technology** for **Navya Naman Vatika**, Bela Bagan, Deoghar.

**Stack:** React 18 + Vite + TypeScript + Tailwind · Django 5 + DRF + SimpleJWT · PostgreSQL · **no Docker**

---

## Roles

| Role | Demo login | Access |
|------|------------|--------|
| Admin | `admin@greenvalley.com` / `Admin123!` | Full society ops, billing, settings |
| Gate Guard | `guard@greenvalley.com` / `Guard123!` | Visitors, flat owners (call/chat), SOS |
| Owner | `resident@greenvalley.com` / `Resident123!` | Own unit bills/payments, gate chat |

---

## Local development

```powershell
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env   # set DB_PASSWORD + SECRET_KEY
python manage.py migrate
python manage.py seed_demo_data
python manage.py runserver 0.0.0.0:8001

# Frontend (new terminal, repo root)
copy .env.example .env   # VITE_API_BASE_URL=http://127.0.0.1:8001
npm install
npm run dev
```

Or: `.\scripts\run-dev.ps1`

---

## Production deploy (single host, Windows)

1. Configure `backend\.env` for production (`DJANGO_ENV=production`, strong `SECRET_KEY`, `DB_*`, `ALLOWED_HOSTS`, SMTP).
2. Build frontend for same-origin API:

```powershell
.\scripts\build-deploy.ps1
```

3. Run API + SPA (Waitress):

```powershell
$env:DJANGO_ENV='production'
.\scripts\run-prod-api.ps1
```

App: `http://SERVER:8001` · Health: `http://SERVER:8001/health/` · Admin: `/admin/`

See **[DEPLOY.md](DEPLOY.md)** for Linux/Gunicorn, HTTPS, and checklist.

---

## Features

- JWT auth (password / OTP / Google demo stub)
- Billing + PDF bills · Payment confirmation email with PDF receipt
- Guard desk, owner directory, gate↔owner chat
- Visitors, SOS, notices, amenities, complaints, expenses
- Mobile-responsive UI

---

## Tests

```powershell
cd backend; .\venv\Scripts\python.exe -m pytest -q
npm run typecheck
npm run build
```
