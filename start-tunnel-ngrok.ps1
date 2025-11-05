# ngrok Tunnel - Alternative to cloudflared
# Creates temporary public URL for your local server

Write-Host "=== ngrok Tunnel ===" -ForegroundColor Cyan
Write-Host "Creating temporary public URL for http://localhost:3005" -ForegroundColor Yellow
Write-Host "Your URL will appear below (starts with https://...ngrok-free.app)" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel when done" -ForegroundColor Gray
Write-Host ""

# Run ngrok - no signup needed for basic usage
npx -y ngrok http 3005

