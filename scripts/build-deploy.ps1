# Build frontend + prepare Django for single-host production deploy (no Docker)
# Usage (from repo root):
#   .\scripts\build-deploy.ps1
# Then:
#   $env:DJANGO_ENV='production'
#   .\scripts\run-prod-api.ps1

param(
  [string]$ApiBaseUrl = ''  # empty = same-origin /api/v1
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Py = Join-Path $Backend 'venv\Scripts\python.exe'

Write-Host "==> Building frontend (VITE_API_BASE_URL='$ApiBaseUrl')"
Push-Location $Root
try {
  $env:VITE_API_BASE_URL = $ApiBaseUrl
  npm ci
  npm run typecheck
  npm run build
} finally {
  Pop-Location
}

if (-not (Test-Path (Join-Path $Root 'dist\index.html'))) {
  throw 'Frontend build failed — dist/index.html missing'
}

if (-not (Test-Path $Py)) {
  Write-Warning "Backend venv not found at $Py — skip migrate/collectstatic"
  Write-Host "Frontend build OK: $Root\dist"
  exit 0
}

Write-Host '==> Django migrate + collectstatic'
Push-Location $Backend
try {
  # Build prep can use development settings; run-prod-api.ps1 enforces production.
  if (-not $env:DJANGO_ENV) { $env:DJANGO_ENV = 'development' }
  & $Py manage.py migrate --noinput
  & $Py manage.py collectstatic --noinput
} finally {
  Pop-Location
}

Write-Host ''
Write-Host 'Deploy build ready.'
Write-Host "  Frontend: $Root\dist"
Write-Host '  Start API+SPA:  $env:DJANGO_ENV=''production''; .\scripts\run-prod-api.ps1'
Write-Host '  Ensure backend\.env has production SECRET_KEY, DB_*, ALLOWED_HOSTS, SMTP.'
