@echo off
echo ===================================================
echo   AAZHI Ocean Portal - Automated GitHub Push
echo ===================================================
echo.

:: Refresh Environment PATH from Windows Registry so newly installed Git is found instantly
for /f "tokens=2*" %%A in ('reg query "HKLM\System\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "SYS_PATH=%%B"
for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%B"
set "PATH=%SYS_PATH%;%USER_PATH%;%PATH%"

cd /d "%~dp0"

echo [1/5] Removing nested .git folders to track frontend properly...
if exist frontend\.git rmdir /s /q frontend\.git
if exist .git rmdir /s /q .git

echo [2/5] Initializing fresh Git repository...
git init
git branch -M main

echo [3/5] Staging all files including frontend...
git add .
git commit -m "Fix Vercel build and deploy AAZHI Ocean Portal"

echo [4/5] Connecting to GitHub and Pushing...
git remote add origin https://github.com/kavithai-kaithi/Aazhi-ocean-portal.git
git push -u origin main -f

echo.
echo ===================================================
echo   SUCCESS! Frontend and Backend pushed to GitHub.
echo ===================================================
pause
