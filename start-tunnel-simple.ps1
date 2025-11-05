# Cloudflare Tunnel - Creates temporary public URL
# This exposes your local http://localhost:3005 to the internet

Write-Host "=== Cloudflare Tunnel ===" -ForegroundColor Cyan
Write-Host "Creating temporary public URL for http://localhost:3005" -ForegroundColor Yellow
Write-Host "Your URL will appear below (starts with https://...trycloudflare.com)" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel when done" -ForegroundColor Gray
Write-Host ""

# Run cloudflared via npx - need to ensure it stays running
# The issue is npx might be exiting, so we'll use cmd to run it
cmd /c "npx -y cloudflared tunnel --url http://localhost:3005"
