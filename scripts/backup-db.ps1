# Backup local PostgreSQL (no Docker). Run from repo root or backend/.
# Usage: .\scripts\backup-db.ps1

param(
  [string]$DbName = 'society_manager_dev',
  [string]$DbUser = 'postgres',
  [string]$OutDir = ''
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
if (-not $OutDir) { $OutDir = Join-Path $Root 'backups' }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$outFile = Join-Path $OutDir "$DbName`_$stamp.sql"

if (-not $env:PGPASSWORD) {
  Write-Host 'Set PGPASSWORD env var to your postgres password before running.'
  exit 1
}

& pg_dump -U $DbUser -h localhost -p 5432 -d $DbName -F p -f $outFile
Write-Host "Backup written to $outFile"
