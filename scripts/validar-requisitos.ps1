[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SismoPaz - Diagnóstico y Validación de Requisitos"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   SISMOPAZ - DIAGNÓSTICO Y VALIDACIÓN DE REQUERIMIENTOS" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Ejecutando verificaciones del entorno...`n" -ForegroundColor Gray

$report = @()
$allOk = $true

function Log-Check($item, $status, $detail) {
    $icon = if ($status) { "[OK]" } else { "[FALLO]" }
    $color = if ($status) { "Green" } else { "Red" }
    Write-Host "$icon $item - $detail" -ForegroundColor $color
    $script:report += "$icon $item : $detail"
    if (-not $status) { $script:allOk = $false }
}

# 1. ENTORNO DE EJECUCIÓN (NODE.JS & NPM)
Write-Host "--- 1. ENTORNO DE EJECUCIÓN (NODE.JS & NPM) ---" -ForegroundColor Yellow
try {
    $nodeVer = (node -v 2>$null)
    if ($nodeVer) { Log-Check "Node.js" $true "Instalado ($nodeVer)" }
    else { Log-Check "Node.js" $false "No encontrado en PATH" }
} catch { Log-Check "Node.js" $false "Error detectando" }

try {
    $npmVer = (npm -v 2>$null)
    if ($npmVer) { Log-Check "npm" $true "Instalado (v$npmVer)" }
    else { Log-Check "npm" $false "No encontrado en PATH" }
} catch { Log-Check "npm" $false "Error detectando" }

# 2. BASE DE DATOS (POSTGRESQL 18)
Write-Host "`n--- 2. BASE DE DATOS (POSTGRESQL 18) ---" -ForegroundColor Yellow
$pgService = Get-Service -Name *postgres* -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'Running' } | Select-Object -First 1
if ($pgService) {
    Log-Check "Servicio PostgreSQL" $true "En ejecución ($($pgService.Name))"
} else {
    Log-Check "Servicio PostgreSQL" $false "El servicio no está en ejecución"
}

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
try {
    $pgVersion = & $psqlPath -U postgres -h localhost -p 5432 -t -A -c "SELECT version();" 2>$null
    if ($pgVersion) {
        $shortVer = ($pgVersion -split " ")[0..1] -join " "
        Log-Check "Conexión PostgreSQL" $true "Conectado a localhost:5432 ($shortVer)"
    } else {
        Log-Check "Conexión PostgreSQL" $false "No se pudo autenticar usuario postgres / 123456"
    }
} catch {
    Log-Check "Conexión PostgreSQL" $false "Error al invocar psql"
}

try {
    $dbExists = & $psqlPath -U postgres -h localhost -p 5432 -t -A -c "SELECT 1 FROM pg_database WHERE datname='sismopaz_db';" 2>$null
    if ($dbExists -match "1") {
        $tablesCount = & $psqlPath -U postgres -h localhost -p 5432 -d sismopaz_db -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
        Log-Check "BD sismopaz_db" $true "Existe con $tablesCount tablas relacionales creadas"
    } else {
        Log-Check "BD sismopaz_db" $false "La base de datos sismopaz_db no existe"
    }
} catch {
    Log-Check "BD sismopaz_db" $false "No se pudo consultar sismopaz_db"
}

# 3. MÓDULO BACKEND
Write-Host "`n--- 3. MÓDULO BACKEND (NESTJS) ---" -ForegroundColor Yellow
$root = Resolve-Path "$PSScriptRoot\.."

# Verificar .env → si no existe pero .env.example sí, copiarlo automáticamente
$envExists = Test-Path "$root\backend\.env"
if (-not $envExists -and (Test-Path "$root\backend\.env.example")) {
    Write-Host "  [AUTO] Copiando .env.example -> .env ..." -ForegroundColor Yellow
    Copy-Item "$root\backend\.env.example" "$root\backend\.env"
    $envExists = $true
}
Log-Check "Archivo .env" $envExists "Configuración presente"

# Verificar node_modules Backend → instalar si faltan
$backendNM = Test-Path "$root\backend\node_modules"
if (-not $backendNM) {
    Write-Host "  [AUTO] Instalando dependencias del backend (npm install)..." -ForegroundColor Yellow
    Push-Location "$root\backend"
    & npm install 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    Pop-Location
    $backendNM = Test-Path "$root\backend\node_modules"
}
Log-Check "node_modules Backend" $backendNM "Dependencias instaladas"

# Verificar compilación Backend → compilar si falta
$backendDist = Test-Path "$root\backend\dist\main.js"
if (-not $backendDist -and $backendNM) {
    Write-Host "  [AUTO] Compilando TypeScript del backend (npx tsc)..." -ForegroundColor Yellow
    Push-Location "$root\backend"
    & npx tsc -p tsconfig.build.json 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    Pop-Location
    $backendDist = Test-Path "$root\backend\dist\main.js"
}
Log-Check "Compilación Backend" $backendDist "TypeScript compilado (dist/main.js)"

# 4. MÓDULO FRONTEND
Write-Host "`n--- 4. MÓDULO FRONTEND (NEXT.JS) ---" -ForegroundColor Yellow

# Verificar node_modules Frontend → instalar si faltan
$frontendNM = Test-Path "$root\frontend\node_modules"
if (-not $frontendNM) {
    Write-Host "  [AUTO] Instalando dependencias del frontend (npm install)..." -ForegroundColor Yellow
    Push-Location "$root\frontend"
    & npm install 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    Pop-Location
    $frontendNM = Test-Path "$root\frontend\node_modules"
}
Log-Check "node_modules Frontend" $frontendNM "Dependencias instaladas"

Log-Check "Código Frontend" (Test-Path "$root\frontend\src\app\page.tsx") "Páginas y UI Kit configurados"

# .next se genera al correr el frontend, solo informar estado
$nextExists = Test-Path "$root\frontend\.next"
if ($nextExists) {
    Write-Host "[OK] Build Frontend - Cache .next disponible" -ForegroundColor Green
} else {
    Write-Host "[INFO] Build Frontend - Cache .next se generará al iniciar el servidor" -ForegroundColor Gray
}

# 5. PUERTOS DE RED
Write-Host "`n--- 5. ESTADO DE PUERTOS DE RED ---" -ForegroundColor Yellow
$p3001 = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($p3001) { Write-Host "  -> Puerto 3001 (Backend API): EN USO (Activo)" -ForegroundColor Green }
else { Write-Host "  -> Puerto 3001 (Backend API): LIBRE" -ForegroundColor Gray }

$p3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($p3000) { Write-Host "  -> Puerto 3000 (Frontend Web): EN USO (Activo)" -ForegroundColor Green }
else { Write-Host "  -> Puerto 3000 (Frontend Web): LIBRE" -ForegroundColor Gray }

# REPORTE FINAL
Write-Host "`n========================================================" -ForegroundColor Cyan
if ($allOk) {
    Write-Host "  DIAGNÓSTICO FINAL: TODOS LOS REQUISITOS ESTÁN CUMPLIDOS" -ForegroundColor Green
} else {
    Write-Host "  DIAGNÓSTICO FINAL: HAY REQUISITOS PENDIENTES" -ForegroundColor Red
}
Write-Host "========================================================`n" -ForegroundColor Cyan

$reportFile = "$root\reporte-validacion.txt"
$report | Out-File -FilePath $reportFile -Encoding UTF8
Write-Host "Reporte guardado en: reporte-validacion.txt" -ForegroundColor Gray
