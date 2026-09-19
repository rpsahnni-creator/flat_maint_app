# Navya Naman Vatika Society Manager — local run helpers (NO Docker)
# Usage (from repo root):
#   .\scripts\run-dev.ps1
#   .\scripts\run-api.ps1
#   .\scripts\run-prod-api.ps1

param(
  [ValidateSet('all', 'api', 'web', 'prod-api')]
  [string]$Mode = 'all',
  [int]$ApiPort = 8001
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Backend = Join-Path $Root 'backend'
$VenvPython = Join-Path $Backend 'venv\Scripts\python.exe'

if (-not (Test-Path $VenvPython)) {
  Write-Error "Backend venv not found at $VenvPython. Create it and pip install -r requirements.txt first."
}

function Start-ApiDev {
  Push-Location $Backend
  try {
    & $VenvPython manage.py migrate --noinput
    & $VenvPython manage.py runserver "0.0.0.0:$ApiPort"
  } finally {
    Pop-Location
  }
}

function Start-ApiProd {
  Push-Location $Backend
  try {
    $env:DJANGO_ENV = 'production'
    & $VenvPython manage.py migrate --noinput
    & $VenvPython manage.py collectstatic --noinput
    & $VenvPython -m waitress --listen="0.0.0.0:$ApiPort" config.wsgi:application
  } finally {
    Pop-Location
  }
}

function Start-Web {
  Push-Location $Root
  try {
    npm run dev -- --host 0.0.0.0 --port 5173
  } finally {
    Pop-Location
  }
}

switch ($Mode) {
  'api' { Start-ApiDev }
  'prod-api' { Start-ApiProd }
  'web' { Start-Web }
  'all' {
    Write-Host "Starting Django API on :$ApiPort and Vite on :5173 in separate windows..."
    Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$Backend'; & '$VenvPython' manage.py runserver 0.0.0.0:$ApiPort"
    Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$Root'; npm run dev -- --host 0.0.0.0 --port 5173"
  }
}
