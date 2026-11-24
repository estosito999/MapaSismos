[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "SismoPaz - Cerrar Puertos y Detener Servidores"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   SISMOPAZ - DETENCIÓN DE SERVIDORES Y CIERRE DE PUERTOS" -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

$ports = @(3000, 3001)

foreach ($port in $ports) {
    Write-Host "[BUSCANDO] Procesos escuchando en puerto $port..." -ForegroundColor Yellow
    $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conns) {
        $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($p in $pids) {
            if ($p -gt 0) {
                $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
                $procName = if ($proc) { $proc.ProcessName } else { "Desconocido" }
                Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
                Write-Host "  -> Proceso PID $p ($procName) detenido en puerto $port." -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  -> El puerto $port ya se encuentra libre." -ForegroundColor Gray
    }
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   PUERTOS 3000 Y 3001 LIBERADOS CORRECTAMENTE" -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Cyan
