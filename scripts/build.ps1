# AAZHI Ocean Platform - Production Build Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "AAZHI Ocean Platform - Production Build" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "`n[1/2] Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location -Path "$RootDir\frontend"
npm install

Write-Host "`n[2/2] Building optimized frontend bundle..." -ForegroundColor Yellow
npm run build

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "✓ Production build completed successfully!" -ForegroundColor Green
Write-Host "  Output Directory: $RootDir\frontend\dist" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
