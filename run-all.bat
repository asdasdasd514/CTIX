@echo off
chcp 65001 >nul
title CTIX - Khoi dong Backend + Frontend

echo [CTIX] Dang khoi dong Backend (Port 4000) va Frontend (Port 5173)...

start "CTIX Backend (4000)" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 2 /nobreak >nul
start "CTIX Frontend (5173)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [CTIX] Da mo 2 cua so Backend va Frontend!
echo   - Backend:  http://localhost:4000/api/health
echo   - Frontend: http://localhost:5173
pause
