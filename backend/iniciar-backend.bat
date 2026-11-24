@echo off
chcp 65001 >nul
title SismoPaz - Backend API REST (:3001)

echo ========================================================
echo   SISMOPAZ - SERVIDOR BACKEND (NESTJS :3001)
echo ========================================================
echo.

cd /d "%~dp0"

if not exist "node_modules\" (
    echo [INFO] Instalando dependencias de Backend...
    call npm install
)

if not exist "dist\main.js" (
    echo [INFO] Compilando TypeScript...
    call npx tsc -p tsconfig.build.json
)

echo [OK] Iniciando API REST en http://localhost:3001 ...
node dist/main.js
if %errorlevel% neq 0 pause
