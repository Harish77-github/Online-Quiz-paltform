@echo off
echo ============================================
echo         QuizHUB - Starting Application
echo ============================================
echo.

echo Stopping existing Node servers...
taskkill /IM node.exe /F >nul 2>&1

echo Starting QuizHUB (backend + frontend)...
start cmd /k "cd /d %~dp0 && npm install && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo   QuizHUB is running!
echo   Open: http://localhost:5000
echo ============================================

pause