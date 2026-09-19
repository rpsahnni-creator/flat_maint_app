# Deployment guide — Navya Naman Vatika Society Manager

Single-process deploy: **Django API + built React SPA** (Waitress on Windows / Gunicorn on Linux). **No Docker.**

## Checklist before go-live

- [ ] PostgreSQL database created
- [ ] `backend/.env` filled (see below)
- [ ] Strong `SECRET_KEY` (not `django-insecure-…`)
- [ ] `ALLOWED_HOSTS` / `CORS_*` / `CSRF_TRUSTED_ORIGINS` set to your domain
- [ ] SMTP credentials for bill/payment PDF emails
- [ ] `npm` + Python 3.11+ + Postgres client available on the server
- [ ] Firewall allows your app port (e.g. 8001) or reverse-proxy 80/443

## 1. Server folders

```text
Navyanaman_app/
  backend/     # Django
  dist/        # created by build
  scripts/
```

Clone or copy the repo, then:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit .env
```

## 2. Production `.env` (backend)

```env
DJANGO_ENV=production
DEBUG=False
SECRET_KEY=<generate-a-long-random-string>

DB_NAME=society_manager
DB_USER=postgres
DB_PASSWORD=<strong-password>
DB_HOST=localhost
DB_PORT=5432
DB_SSLMODE=prefer

ALLOWED_HOSTS=your.domain.com,www.your.domain.com
CORS_ALLOWED_ORIGINS=https://your.domain.com
CSRF_TRUSTED_ORIGINS=https://your.domain.com

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@navyanamanvatika.com

SERVE_SPA=True
# FRONTEND_DIST optional — defaults to repo ../dist

# When HTTPS reverse proxy is in place:
# SECURE_SSL_REDIRECT=True
# SESSION_COOKIE_SECURE=True
# CSRF_COOKIE_SECURE=True
# SECURE_HSTS_SECONDS=31536000
```

## 3. Build + migrate

From **repo root**:

```powershell
.\scripts\build-deploy.ps1
```

This runs `npm ci`, `typecheck`, `vite build` (same-origin `/api/v1`), then Django `migrate` + `collectstatic`.

Seed demo users only on staging:

```powershell
cd backend
.\venv\Scripts\python.exe manage.py seed_demo_data
```

## 4. Run (Windows)

```powershell
$env:DJANGO_ENV='production'
.\scripts\run-prod-api.ps1
```

- App UI: `http://HOST:8001/`
- Health: `http://HOST:8001/health/`
- Django admin: `http://HOST:8001/admin/`

## 5. Run (Linux)

```bash
export DJANGO_ENV=production
export FRONTEND_DIST=/path/to/Navyanaman_app/dist
export SERVE_SPA=True
cd backend
source venv/bin/activate
python manage.py migrate --noinput
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:8001 --workers 3
```

Put **nginx** or **Caddy** in front for TLS; proxy to `127.0.0.1:8001`.

## 6. Separate frontend host (optional)

If the SPA is on Netlify/Vercel and API elsewhere:

1. Build with `VITE_API_BASE_URL=https://api.your.domain.com`
2. Set `SERVE_SPA=False` on the API host
3. Add the SPA origin to `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`

## 7. Ops

```powershell
# DB backup
.\scripts\backup-db.ps1

# Overdue bills
cd backend; .\venv\Scripts\python.exe manage.py reconcile_overdue
```

## Security notes

- Never commit `.env` or `venv/`
- Turn off demo OTP/Google shortcuts: production sets `AUTH_DEMO_MODE=False`
- Change all demo passwords after first login
- Prefer HTTPS + HSTS in production
