@echo off
REM update-api-url.bat
REM Script untuk update API URL di frontend setelah deploy Railway (Windows)

echo ====================================
echo    Update API URL Script (Windows)
echo ====================================
echo.

set /p RAILWAY_URL="Masukkan Railway URL kamu (contoh: https://track-senpi-production.up.railway.app): "

REM Remove trailing slash if any
if "%RAILWAY_URL:~-1%"=="/" set RAILWAY_URL=%RAILWAY_URL:~0,-1%

echo.
echo Railway URL: %RAILWAY_URL%
echo API URL: %RAILWAY_URL%/api
echo.

REM Backup original file
copy js\api-client.js js\api-client.js.backup >nul
echo [OK] Backup created: js\api-client.js.backup

REM Update API URL using PowerShell
powershell -Command "(Get-Content js\api-client.js) -replace \"'https://your-railway-app.up.railway.app/api'\", \"'%RAILWAY_URL%/api'\" | Set-Content js\api-client.js"

echo [OK] Updated js\api-client.js
echo.
echo Done! API URL berhasil di-update.
echo.
echo Next steps:
echo 1. Commit changes: git add js\api-client.js
echo 2. Push to repository: git commit -m "Update API URL" ^&^& git push
echo 3. Test login di browser
echo.
pause
