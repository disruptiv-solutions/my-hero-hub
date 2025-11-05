# Cloudflare Tunnel Script
Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan
Write-Host "Your dev server should be running on http://localhost:3005" -ForegroundColor Yellow
Write-Host ""

# Check if dev server is running
$portCheck = Test-NetConnection -ComputerName localhost -Port 3005 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $portCheck) {
    Write-Host "Error: Dev server is not running on port 3005!" -ForegroundColor Red
    Write-Host "Please start it first with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "Dev server detected. Creating tunnel..." -ForegroundColor Green
Write-Host ""

# Run cloudflared - it will output the URL
npx -y cloudflared tunnel --url http://localhost:3005
