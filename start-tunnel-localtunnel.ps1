# localtunnel - Alternative that works without issues
# No Windows security blocking, no signup needed

Write-Host "=== localtunnel ===" -ForegroundColor Cyan
Write-Host "Creating temporary public URL for http://localhost:3005" -ForegroundColor Yellow
Write-Host ""
Write-Host "Your URL will appear below (starts with https://...loca.lt)" -ForegroundColor White
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npx -y localtunnel --port 3005





