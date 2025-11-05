# Creating Temporary Public URLs for Your Local App

## Quick Answer

You have **two easy options** to create a temporary public URL that anyone can access:

## Option 1: Cloudflare Tunnel (Recommended) ⭐

**No signup required** - Works immediately!

### Quick Start:

1. **Make sure your dev server is running:**
   ```powershell
   npm run dev
   ```

2. **Run the tunnel script:**
   ```powershell
   .\start-tunnel-simple.ps1
   ```

   OR directly:
   ```powershell
   npx -y cloudflared tunnel --url http://localhost:3005 2>&1
   ```

3. **Copy the URL** that appears (looks like `https://xxxx-xx-xx-xx-xx.trycloudflare.com`)

4. **Share it** - Anyone can access your local app at that URL!

### Features:
- ✅ **Free** - No account needed
- ✅ **HTTPS** - Secure by default
- ✅ **Temporary** - URL expires when you stop the tunnel
- ✅ **Instant** - Works immediately

---

## Option 2: ngrok (Alternative)

**Also free and easy!**

### Quick Start:

1. **Make sure your dev server is running:**
   ```powershell
   npm run dev
   ```

2. **Run ngrok:**
   ```powershell
   .\start-tunnel-ngrok.ps1
   ```

   OR directly:
   ```powershell
   npx -y ngrok http 3005
   ```

3. **Copy the URL** from the ngrok dashboard that opens

### Features:
- ✅ **Free** - Basic tier available
- ✅ **HTTPS** - Secure by default
- ✅ **Web Dashboard** - Visual interface to see requests
- ✅ **Temporary** - URL expires when you stop

---

## How It Works

Both services create a **secure tunnel** from a public URL on the internet to your local `http://localhost:3005`. 

```
Internet → Cloudflare/ngrok Server → Your Local Machine (localhost:3005)
```

## Stopping the Tunnel

Just press **Ctrl+C** in the terminal where the tunnel is running.

## Important Notes

- ⚠️ **Temporary URLs** - They expire when you stop the tunnel
- 🔒 **HTTPS** - Both services provide SSL automatically
- 🌐 **Public Access** - Anyone with the URL can access your app
- 🔒 **Security** - Only use for development/testing, not production data

## Troubleshooting

### URL doesn't appear?
- Make sure your dev server is running on port 3005
- Try the `2>&1` redirect: `npx -y cloudflared tunnel --url http://localhost:3005 2>&1`
- Check that port 3005 is not blocked by firewall

### Connection refused?
- Verify your dev server is running: `Test-NetConnection -ComputerName localhost -Port 3005`
- Make sure nothing else is using port 3005

### Slow connection?
- Free tiers have some latency - this is normal
- Both services work best for demos/testing, not production
