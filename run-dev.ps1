# ==================================================================
#  run-dev.ps1 – Safe Vite Runner
#  يغلق عمليات Vite فقط ثم يشغّل السرفر على 5173
# ==================================================================

Write-Host "🔍 Checking for Vite processes..." -ForegroundColor Cyan

# إيقاف عمليات Vite فقط (لا يقتل كل node)
$viteProcesses = Get-Process node -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*vite*" -or $_.CommandLine -like "*vite*"
}

if ($viteProcesses) {
    Write-Host "🛑 Stopping old Vite instance..." -ForegroundColor Yellow
    $viteProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 300
} else {
    Write-Host "✔ No existing Vite processes found." -ForegroundColor Green
}

# تحرير المنفذ 5173 إذا كان مشغولاً من عملية أخرى
function Stop-PortListener($port) {
    try {
        $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
        if ($listeners) {
            $listenerPids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pidVal in $listenerPids) {
                Write-Host "🛑 Port $port in use by PID $pidVal. Stopping..." -ForegroundColor Yellow
                Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Milliseconds 300
            return
        }
    } catch {
        # fallback to netstat
        $netstat = netstat -ano | Select-String ":$port\s+.*LISTENING" -ErrorAction SilentlyContinue
        if ($netstat) {
            $listenerPids = $netstat | ForEach-Object {
                $parts = ($_ -split "\s+")
                $parts[-1]
            } | Sort-Object -Unique
            foreach ($pidVal in $listenerPids) {
                Write-Host "🛑 Port $port in use by PID $pidVal (netstat). Stopping..." -ForegroundColor Yellow
                Stop-Process -Id $pidVal -Force -ErrorAction SilentlyContinue
            }
            Start-Sleep -Milliseconds 300
        }
    }
}

# تحرير المنفذ 5173 إذا كان مشغولاً
$port = 5173
Stop-PortListener -port $port

Write-Host "🚀 Starting Vite dev server on port 5173..." -ForegroundColor Cyan

npm run dev
