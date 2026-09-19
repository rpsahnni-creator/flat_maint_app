# Production API on Windows without Docker (Waitress + WhiteNoise)
# Usage from repo root:
#   $env:DJANGO_ENV='production'
#   .\scripts\run-prod-api.ps1

param([int]$Port = 8001)

$ErrorActionPreference = 'Stop'
$Backend = Join-Path (Split-Path -Parent $PSScriptRoot) 'backend'
$Py = Join-Path $Backend 'venv\Scripts\python.exe'

Push-Location $Backend
try {
  if (-not $env:DJANGO_ENV) { $env:DJANGO_ENV = 'production' }
  & $Py manage.py migrate --noinput
  & $Py manage.py collectstatic --noinput
  & $Py manage.py reconcile_overdue
  Write-Host "Serving API on 0.0.0.0:$Port (Waitress)"
  & $Py -m waitress --listen="0.0.0.0:$Port" config.wsgi:application
} finally {
  Pop-Location
}
