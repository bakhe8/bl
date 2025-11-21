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

Write-Host "🚀 Starting Vite dev server on port 5173..." -ForegroundColor Cyan

npm run dev
