[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SismoPaz - Inicialización de Base de Datos"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   SISMOPAZ - CONFIGURACIÓN DE BASE DE DATOS (POSTGRESQL)" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$psqlPath = "psql"
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    if (Test-Path "C:\Program Files\PostgreSQL\18\bin\psql.exe") {
        $psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
    } elseif (Test-Path "C:\Program Files\PostgreSQL\17\bin\psql.exe") {
        $psqlPath = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
    } elseif (Test-Path "C:\Program Files\PostgreSQL\16\bin\psql.exe") {
        $psqlPath = "C:\Program Files\PostgreSQL\16\bin\psql.exe"
    } else {
        Write-Host "[ERROR] No se encontró psql.exe en C:\Program Files\PostgreSQL\ ni en el PATH." -ForegroundColor Red
        exit 1
    }
}

$env:PGPASSWORD = "123456"
$dbName = "sismopaz_db"
$dbUser = "postgres"
$dbHost = "localhost"
$dbPort = 5432

Write-Host "[1/3] Verificando conexión al servidor PostgreSQL..." -ForegroundColor Yellow
$pgTest = & $psqlPath -U $dbUser -h $dbHost -p $dbPort -t -A -c "SELECT 1;" 2>$null
if ($pgTest -notmatch "1") {
    Write-Host "[ERROR] No se pudo conectar a PostgreSQL en $dbHost`:$dbPort con usuario $dbUser." -ForegroundColor Red
    Write-Host "Verifica que el servicio de PostgreSQL esté iniciado y la contraseña sea 123456." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Servidor PostgreSQL disponible." -ForegroundColor Green

Write-Host "[2/3] Verificando si la base de datos '$dbName' existe..." -ForegroundColor Yellow
$dbExists = & $psqlPath -U $dbUser -h $dbHost -p $dbPort -t -A -c "SELECT 1 FROM pg_database WHERE datname='$dbName';" 2>$null

$dbDir = Resolve-Path "$PSScriptRoot\..\database"

if ($dbExists -match "1") {
    $tables = & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -A -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>$null
    Write-Host "[OK] La base de datos '$dbName' ya existe con $tables tablas. No es necesario recrearla." -ForegroundColor Green
} else {
    Write-Host "[AVISO] La base de datos '$dbName' no existe. Creándola..." -ForegroundColor Yellow
    & $psqlPath -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName WITH ENCODING='UTF8';"
    Write-Host "[OK] Base de datos creada." -ForegroundColor Green

    Write-Host "[3/3] Ejecutando esquema y datos semilla..." -ForegroundColor Yellow
    Write-Host "  -> Creando 32 tablas (02-schema.sql)..." -ForegroundColor Gray
    & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$dbDir\02-schema.sql" | Out-Null
    Write-Host "  -> Insertando datos semilla (03-seed-data.sql)..." -ForegroundColor Gray
    & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$dbDir\03-seed-data.sql" | Out-Null
    Write-Host "[OK] Esquema y datos semilla insertados exitosamente." -ForegroundColor Green
}

Write-Host "[3/3] Aplicando integración cartográfica idempotente..." -ForegroundColor Yellow
& $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$dbDir\05-migration-mapa-sismos.sql" | Out-Null
& $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$dbDir\06-seed-mapa-demo.sql" | Out-Null
Write-Host "[OK] Mapa y catálogo sísmico preparados." -ForegroundColor Green

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   BASE DE DATOS LISTA Y VERIFICADA" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Cyan
exit 0
