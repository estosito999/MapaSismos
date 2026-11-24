[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SismoPaz - Reseteo de Base de Datos"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   SISMOPAZ - RESETEO DE BASE DE DATOS (DESARROLLO)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Buscar psql
$psqlPath = "psql"
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    @("18","17","16") | ForEach-Object {
        $p = "C:\Program Files\PostgreSQL\$_\bin\psql.exe"
        if ((Test-Path $p) -and $psqlPath -eq "psql") { $psqlPath = $p }
    }
}

$env:PGPASSWORD = "123456"
$dbName = "sismopaz_db"
$dbUser = "postgres"
$dbHost = "localhost"
$dbPort = 5432
$root = Resolve-Path "$PSScriptRoot\.."

# Verificar conexión
$test = & $psqlPath -U $dbUser -h $dbHost -p $dbPort -t -A -c "SELECT 1;" 2>$null
if ($test -notmatch "1") {
    Write-Host "[ERROR] No se pudo conectar a PostgreSQL en $dbHost`:$dbPort." -ForegroundColor Red
    Write-Host "Verifica que el servicio esté iniciado y la contraseña sea 123456." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Conexión con PostgreSQL establecida.`n" -ForegroundColor Green

Write-Host "Selecciona una opción:" -ForegroundColor Yellow
Write-Host "  [1] Vaciar todas las tablas (TRUNCATE CASCADE)" -ForegroundColor White
Write-Host "  [2] Vaciar + Recargar semilla (seed-data)" -ForegroundColor White
Write-Host "  [3] Destruir BD completa + Recrear desde cero" -ForegroundColor White
Write-Host "  [0] Cancelar" -ForegroundColor Gray
Write-Host ""
$opcion = Read-Host "Opción"

switch ($opcion) {
    "1" {
        Write-Host "`n[EJECUTANDO] Vaciando todas las tablas..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -A -c "
            DO `$`$ DECLARE r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
                END LOOP;
            END `$`$;
        " 2>&1 | Out-Null
        Write-Host "[OK] Todas las tablas vaciadas (IDs reiniciados)." -ForegroundColor Green
    }
    "2" {
        Write-Host "`n[EJECUTANDO] Vaciando todas las tablas..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -t -A -c "
            DO `$`$ DECLARE r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                    EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
                END LOOP;
            END `$`$;
        " 2>&1 | Out-Null
        Write-Host "[OK] Tablas vaciadas." -ForegroundColor Green

        Write-Host "[EJECUTANDO] Recargando datos semilla (03-seed-data.sql)..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$root\database\03-seed-data.sql" 2>&1 | Out-Null
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$root\database\05-migration-mapa-sismos.sql" 2>&1 | Out-Null
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$root\database\06-seed-mapa-demo.sql" 2>&1 | Out-Null
        Write-Host "[OK] Semilla recargada exitosamente." -ForegroundColor Green
    }
    "3" {
        Write-Host "`n[ADVERTENCIA] Esto DESTRUIRA la base de datos completa." -ForegroundColor Red
        Write-Host "Se eliminaran TODAS las tablas, datos y se recreara desde cero." -ForegroundColor Red
        $confirm = Read-Host "Escribe 'CONFIRMAR' para continuar"
        if ($confirm -ne "CONFIRMAR") {
            Write-Host "Operación cancelada." -ForegroundColor Gray
            exit 0
        }

        # Cerrar conexiones activas a la BD
        Write-Host "`n[EJECUTANDO] Cerrando conexiones activas..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -t -A -c "
            SELECT pg_terminate_backend(pid) FROM pg_stat_activity
            WHERE datname = '$dbName' AND pid <> pg_backend_pid();
        " 2>&1 | Out-Null

        Write-Host "[EJECUTANDO] Eliminando base de datos '$dbName'..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -c "DROP DATABASE IF EXISTS $dbName;" 2>&1 | Out-Null

        Write-Host "[EJECUTANDO] Creando base de datos '$dbName'..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName WITH ENCODING='UTF8';" 2>&1 | Out-Null

        Write-Host "[EJECUTANDO] Aplicando esquema (02-schema.sql)..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$root\database\02-schema.sql" 2>&1 | Out-Null

        Write-Host "[EJECUTANDO] Insertando datos semilla (03-seed-data.sql)..." -ForegroundColor Yellow
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$root\database\03-seed-data.sql" 2>&1 | Out-Null
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$root\database\05-migration-mapa-sismos.sql" 2>&1 | Out-Null
        & $psqlPath -U $dbUser -h $dbHost -p $dbPort -d $dbName -f "$root\database\06-seed-mapa-demo.sql" 2>&1 | Out-Null

        Write-Host "[OK] Base de datos recreada completamente desde cero." -ForegroundColor Green
    }
    default {
        Write-Host "Operación cancelada." -ForegroundColor Gray
        exit 0
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   OPERACIÓN FINALIZADA" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Cyan
