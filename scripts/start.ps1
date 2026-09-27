# AAZHI Ocean Platform - Production Launch Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "AAZHI Ocean Platform - Production Launch" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location -Path $RootDir

if (-not (Test-Path "$RootDir\frontend\dist")) {
    Write-Host "[!] Frontend build not detected. Running build..." -ForegroundColor Yellow
    & "$ScriptDir\build.ps1"
}

$env:ENVIRONMENT = "production"
$env:HOST = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$env:PORT = if ($env:PORT) { $env:PORT } else { "8000" }

Write-Host "[*] Starting production server on http://$($env:HOST):$($env:PORT)" -ForegroundColor Green
python -m uvicorn backend.main:app --host $env:HOST --port [int]$env:PORT
