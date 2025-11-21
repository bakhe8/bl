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
try {
    $port = 5173
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($listeners) {
        $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $pids) {
            try {
                Write-Host "🛑 Port $port in use by PID $pid. Stopping..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            } catch {
                Write-Host "⚠️ لم يتمكن السكربت من إيقاف PID $pid. أغلقه يدوياً إن لزم." -ForegroundColor Magenta
            }
        }
        Start-Sleep -Milliseconds 300
    }
} catch {
    Write-Host "⚠️ لم يُستخدم Get-NetTCPConnection (قد لا يكون متاحاً)، تابع التشغيل." -ForegroundColor Magenta
}

Write-Host "🚀 Starting Vite dev server on port 5173..." -ForegroundColor Cyan

npm run dev
