@echo off
REM test-backend.bat
REM Quick test script untuk backend API

echo ====================================
echo   Track Senpi - Backend API Test
echo ====================================
echo.

REM Check if server is running
echo [1/5] Testing server health...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing; Write-Host '[OK] Server is running' -ForegroundColor Green; $response.Content } catch { Write-Host '[FAIL] Server tidak running. Jalankan: cd backend; npm run dev' -ForegroundColor Red; exit 1 }"
echo.

REM Test admin login
echo [2/5] Testing admin login...
powershell -Command "$body = @{ nrp = '00000001'; password = 'admin123' } | ConvertTo-Json; try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host '[OK] Admin login berhasil' -ForegroundColor Green; $json = $response.Content | ConvertFrom-Json; $json.token } catch { Write-Host '[FAIL] Admin login gagal' -ForegroundColor Red }"
echo.

REM Test get users
echo [3/5] Testing get users...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/users' -UseBasicParsing; Write-Host '[OK] Get users berhasil' -ForegroundColor Green } catch { Write-Host '[FAIL] Get users gagal' -ForegroundColor Red }"
echo.

REM Test get senpi
echo [4/5] Testing get senpi...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/senpi' -UseBasicParsing; Write-Host '[OK] Get senpi berhasil' -ForegroundColor Green } catch { Write-Host '[FAIL] Get senpi gagal' -ForegroundColor Red }"
echo.

REM Test get locations
echo [5/5] Testing get locations...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/location/latest' -UseBasicParsing; Write-Host '[OK] Get locations berhasil' -ForegroundColor Green } catch { Write-Host '[FAIL] Get locations gagal' -ForegroundColor Red }"
echo.

echo ====================================
echo   Test Selesai!
echo ====================================
echo.
echo Next: Buka index.html di browser dan test login
echo.
pause
