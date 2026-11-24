@echo off
chcp 65001 >nul
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\scripts\iniciar-db.ps1"
if %errorlevel% neq 0 pause
