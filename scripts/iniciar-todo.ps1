[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SismoPaz - Consola Unificada del Sistema"

Clear-Host
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      SISMOPAZ - CONSOLA UNIFICADA (TODO EN UNO)        " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Ejecutando por fases en una sola terminal...`n" -ForegroundColor Gray

$root = Resolve-Path "$PSScriptRoot\.."

# ==========================================
# FASE 1: BASE DE DATOS POSTGRESQL
# ==========================================
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host "[FASE 1/3] VERIFICANDO BASE DE DATOS POSTGRESQL" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow

$psqlPath = "psql"
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Program Files\PostgreSQL\18\bin\psql.exe") {
        $psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    } elseif (Test-Path "C:\Program Files\PostgreSQL\17\bin\psql.exe") {
        $psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    } elseif (Test-Path "C:\Program Files\PostgreSQL\16\bin\psql.exe") {
        $psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
    }
}

$env:PGPASSWORD = "123456"
$dbTest = & $psqlPath -U postgres -h localhost -p 5432 -t -A -c "SELECT 1;" 2>$null
if ($dbTest -notmatch "1") {
    Write-Host "[ERROR] PostgreSQL no está disponible en localhost:5432." -ForegroundColor Red
    Write-Host "Inicia el servicio de PostgreSQL y vuelve a intentar." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "[OK] Conexión con PostgreSQL establecida." -ForegroundColor Green

$dbExists = & $psqlPath -U postgres -h localhost -p 5432 -t -A -c "SELECT 1 FROM pg_database WHERE datname='sismopaz_db';" 2>$null
if ($dbExists -match "1") {
    $tables = & $psqlPath -U postgres -h localhost -p 5432 -d sismopaz_db -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
    Write-Host "[OK] Base de datos 'sismopaz_db' detectada con $tables tablas relacionales." -ForegroundColor Green
} else {
    Write-Host "[AVISO] 'sismopaz_db' no existe. Creando base de datos..." -ForegroundColor Yellow
    & $psqlPath -U postgres -h localhost -p 5432 -c "CREATE DATABASE sismopaz_db WITH ENCODING='UTF8';"
    Write-Host "[OK] Base de datos creada. Ejecutando esquema y catálogos semilla..." -ForegroundColor Gray
    & $psqlPath -U postgres -h localhost -p 5432 -d sismopaz_db -f "$root\database\02-schema.sql" | Out-Null
    & $psqlPath -U postgres -h localhost -p 5432 -d sismopaz_db -f "$root\database\03-seed-data.sql" | Out-Null
    Write-Host "[OK] Tablas y catálogos iniciales insertados con éxito." -ForegroundColor Green
}

& $psqlPath -U postgres -h localhost -p 5432 -d sismopaz_db -f "$root\database\05-migration-mapa-sismos.sql" | Out-Null
& $psqlPath -U postgres -h localhost -p 5432 -d sismopaz_db -f "$root\database\06-seed-mapa-demo.sql" | Out-Null
Write-Host "[OK] Integración cartográfica verificada." -ForegroundColor Green

# Liberar puertos 3000 y 3001 por si quedaron procesos previos
$ports = @(3000, 3001)
foreach ($p in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pidToKill in $pids) {
            if ($pidToKill -gt 0) {
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# ==========================================
# FASE 2: BACKEND NESTJS
# ==========================================
Write-Host "`n--------------------------------------------------------" -ForegroundColor Yellow
Write-Host "[FASE 2/3] INICIANDO BACKEND (NESTJS :3001)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow

if (-not (Test-Path "$root\backend\node_modules")) {
    Write-Host "[INFO] Instalando dependencias del backend..." -ForegroundColor Gray
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install" -WorkingDirectory "$root\backend" -NoNewWindow -Wait
}
if (-not (Test-Path "$root\backend\dist\main.js")) {
    Write-Host "[INFO] Compilando TypeScript del backend..." -ForegroundColor Gray
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npx tsc -p tsconfig.build.json" -WorkingDirectory "$root\backend" -NoNewWindow -Wait
}

Write-Host "[INICIANDO] Servidor Backend en puerto 3001..." -ForegroundColor Gray
$backendProcess = Start-Process -FilePath "node" -ArgumentList "dist/main.js" -WorkingDirectory "$root\backend" -PassThru -NoNewWindow

# Esperar a que el backend responda en puerto 3001
$backendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Milliseconds 800
    $conn = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
    if ($conn) {
        $backendReady = $true
        break
    }
}

if ($backendReady) {
    Write-Host "[OK] Backend activo y escuchando en http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "[AVISO] El backend está iniciando..." -ForegroundColor Yellow
}

# ==========================================
# FASE 3: FRONTEND NEXT.JS
# ==========================================
Write-Host "`n--------------------------------------------------------" -ForegroundColor Yellow
Write-Host "[FASE 3/3] INICIANDO FRONTEND (NEXT.JS :3000)" -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow

if (-not (Test-Path "$root\frontend\node_modules")) {
    Write-Host "[INFO] Instalando dependencias del frontend..." -ForegroundColor Gray
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm install" -WorkingDirectory "$root\frontend" -NoNewWindow -Wait
}

Write-Host "[INICIANDO] Servidor Web en puerto 3000 (Modo Desarrollo)..." -ForegroundColor Gray
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory "$root\frontend" -PassThru -NoNewWindow

# Esperar a que el frontend responda en puerto 3000
$frontendReady = $false
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 800
    $conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($conn) {
        $frontendReady = $true
        break
    }
}

if ($frontendReady) {
    Write-Host "[OK] Frontend activo y escuchando en http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "[AVISO] El frontend está iniciando..." -ForegroundColor Yellow
}

# ==========================================
# RESUMEN Y NAVEGADOR
# ==========================================
Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "     ¡TODO EL SISTEMA ESTÁ CORRIENDO EN ESTA TERMINAL!   " -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  • Frontend Web:      http://localhost:3000" -ForegroundColor White
Write-Host "  • Backend API REST:  http://localhost:3001/api" -ForegroundColor White
Write-Host "  • Base de Datos:     PostgreSQL (sismopaz_db)" -ForegroundColor White
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host "  • Login Admin:      admin@sismopaz.bo / Admin2026!" -ForegroundColor Gray
Write-Host "  • Login Sismólogo:  juan.perez@ejemplo.com / Password123!" -ForegroundColor Gray
Write-Host "========================================================`n" -ForegroundColor Cyan

Write-Host "Abriendo http://localhost:3000 en tu navegador predeterminado..." -ForegroundColor Gray
Start-Process "http://localhost:3000"

Write-Host "`n[CONTROL] Presiona 'Q' o Ctrl+C en esta terminal para detener todos los servidores y salir.`n" -ForegroundColor Yellow

# Bucle de monitoreo interactivo en la misma consola
try {
    while ($true) {
        if ([System.Console]::KeyAvailable) {
            $key = [System.Console]::ReadKey($true).Key
            if ($key -eq [System.ConsoleKey]::Q -or $key -eq [System.ConsoleKey]::X -or $key -eq [System.ConsoleKey]::Escape) {
                Write-Host "`nDeteniendo servicios..." -ForegroundColor Yellow
                break
            }
        }
        if ($backendProcess.HasExited) {
            Write-Host "[ALERTA] El proceso Backend se ha detenido." -ForegroundColor Red
            break
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "`nCerrando Backend (PID $($backendProcess.Id))..." -ForegroundColor Gray
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue

    Write-Host "Cerrando Frontend (PID $($frontendProcess.Id))..." -ForegroundColor Gray
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue

    # Asegurar liberación de puertos 3000 y 3001
    foreach ($p in $ports) {
        $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pidToKill in $pids) {
                if ($pidToKill -gt 0) {
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }

    Write-Host "`n[OK] Todos los servicios detenidos y puertos 3000 y 3001 liberados.`n" -ForegroundColor Green
}
