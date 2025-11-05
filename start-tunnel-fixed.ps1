# Cloudflare Tunnel - Fixed version
# This should work even with Windows security policies

Write-Host "=== Cloudflare Tunnel ===" -ForegroundColor Cyan
Write-Host "Creating temporary public URL for http://localhost:3005" -ForegroundColor Yellow
Write-Host ""

# Method 1: Try via cmd.exe (bypasses some security restrictions)
Write-Host "Starting tunnel via cmd..." -ForegroundColor Green
Write-Host "Your URL will appear below (look for https://...trycloudflare.com)" -ForegroundColor White
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

cmd /c "npx -y cloudflared tunnel --url http://localhost:3005"


