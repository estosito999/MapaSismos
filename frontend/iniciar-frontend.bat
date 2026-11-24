@echo off
chcp 65001 >nul
title SismoPaz - Frontend Web (:3000)

echo ========================================================
echo   SISMOPAZ - FRONTEND NEXT.JS (PUERTO :3000)
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [INFO] Instalando dependencias de Frontend...
    call npm install
)

echo [OK] Iniciando Next.js en http://localhost:3000 ...
call npm run dev
if %errorlevel% neq 0 pause
