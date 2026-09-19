# Production API + SPA on Windows (Waitress + WhiteNoise), no Docker
# Prereq: .\scripts\build-deploy.ps1  AND production backend\.env
# Usage:
#   $env:DJANGO_ENV='production'
#   .\scripts\run-prod-api.ps1

param([int]$Port = 8001)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$Py = Join-Path $Backend 'venv\Scripts\python.exe'
$Dist = Join-Path $Root 'dist'

if (-not (Test-Path $Py)) {
  throw "Backend venv not found: $Py"
}
if (-not (Test-Path (Join-Path $Dist 'index.html'))) {
  throw "Frontend dist missing. Run: .\scripts\build-deploy.ps1"
}

Push-Location $Backend
try {
  if (-not $env:DJANGO_ENV) { $env:DJANGO_ENV = 'production' }
  if (-not $env:FRONTEND_DIST) { $env:FRONTEND_DIST = $Dist }
  if (-not $env:SERVE_SPA) { $env:SERVE_SPA = 'True' }

  New-Item -ItemType Directory -Force -Path (Join-Path $Backend 'logs') | Out-Null
  & $Py manage.py migrate --noinput
  & $Py manage.py collectstatic --noinput
  try { & $Py manage.py reconcile_overdue } catch { Write-Warning $_.Exception.Message }

  Write-Host "Serving API + SPA on http://0.0.0.0:$Port (Waitress)"
  & $Py -m waitress --listen="0.0.0.0:$Port" config.wsgi:application
} finally {
  Pop-Location
}
