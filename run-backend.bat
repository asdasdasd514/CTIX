@echo off
chcp 65001 >nul
title CTIX - Backend API (Port 4000)

cd /d "%~dp0backend"

if not exist "node_modules" (
  echo [CTIX] Dang cai dat thu vien Backend...
  call npm install
)

echo ==================================================
echo   CTIX - TRAN BIEN SMARTCITY BACKEND API
echo   URL: http://localhost:4000/api/health
echo ==================================================
echo.

call npm run dev
pause
