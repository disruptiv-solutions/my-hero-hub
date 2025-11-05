# Deployment Guide for Hero Hub

This guide covers deploying Hero Hub to production environments.

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Prerequisites
- GitHub account
- Vercel account (free tier available)
- Your code pushed to GitHub

#### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial Hero Hub setup"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables**
   
   In Vercel dashboard, add these variables:
   
   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   NEXTAUTH_SECRET=your_generated_secret
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

4. **Update Google OAuth**
   
   In Google Cloud Console, add production redirect URI:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Visit your live site!

#### Custom Domain (Optional)

1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` in environment variables
5. Update Google OAuth redirect URI

### Option 2: Self-Hosted (VPS/Cloud)

Deploy on your own server (Ubuntu/Debian example).

#### Prerequisites
- VPS with Ubuntu 22.04+
- Domain name pointed to your server
- Node.js 18+ installed

#### Steps

1. **Setup Server**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install -y nginx
   ```

2. **Clone Repository**
   ```bash
   cd /var/www
   git clone your-repo-url hero-hub
   cd hero-hub
   npm install
   ```

3. **Configure Environment**
   ```bash
   nano .env.local
   ```
   
   Add your environment variables:
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXTAUTH_SECRET=your_secret
   NEXTAUTH_URL=https://yourdomain.com
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Start with PM2**
   ```bash
   pm2 start npm --name "hero-hub" -- start
   pm2 save
   pm2 startup
   ```

6. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/hero-hub
   ```
   
   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
   
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/hero-hub /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

8. **Update Google OAuth**
   - Add redirect URI: `https://yourdomain.com/api/auth/callback/google`

### Option 3: Docker

Containerize Hero Hub for easy deployment.

#### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  hero-hub:
    build: .
    ports:
      - "3001:3001"
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    restart: unless-stopped
```

#### Deploy

```bash
docker-compose up -d
```

## Database Setup (Production)

For production, use a proper database instead of mock data.

### Using Supabase (Recommended)

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Copy database URL

2. **Add to Environment Variables**
   ```
   DATABASE_URL=postgresql://postgres:[password]@db.xxx.supabase.co:5432/postgres
   ```

3. **Create Tables**
   
   Run in Supabase SQL Editor:
   ```sql
   -- Clients table
   CREATE TABLE clients (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     phone TEXT,
     status TEXT NOT NULL CHECK (status IN ('lead', 'active', 'closed')),
     value DECIMAL(10, 2),
     last_contact TIMESTAMP,
     created_date TIMESTAMP DEFAULT NOW(),
     notes TEXT,
     project_count INTEGER DEFAULT 0
   );
   
   -- Transactions table
   CREATE TABLE transactions (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     client_id UUID REFERENCES clients(id),
     amount DECIMAL(10, 2) NOT NULL,
     date TIMESTAMP NOT NULL,
     type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
     status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled')),
     description TEXT NOT NULL,
     category TEXT
   );
   
   -- Marketing campaigns table
   CREATE TABLE marketing_campaigns (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id TEXT NOT NULL,
     name TEXT NOT NULL,
     platform TEXT NOT NULL,
     status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')),
     spend DECIMAL(10, 2) NOT NULL,
     impressions INTEGER NOT NULL,
     clicks INTEGER NOT NULL,
     conversions INTEGER NOT NULL,
     start_date TIMESTAMP NOT NULL,
     end_date TIMESTAMP
   );
   
   -- Create indexes
   CREATE INDEX idx_clients_user_id ON clients(user_id);
   CREATE INDEX idx_transactions_user_id ON transactions(user_id);
   CREATE INDEX idx_campaigns_user_id ON marketing_campaigns(user_id);
   ```

4. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

5. **Update API Routes**
   
   Example for clients:
   ```typescript
   import { createClient } from '@supabase/supabase-js';
   
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_KEY!
   );
   
   export async function GET(request: NextRequest) {
     const session = await getServerSession(authOptions);
     if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
     
     const { data, error } = await supabase
       .from('clients')
       .select('*')
       .eq('user_id', session.user?.email);
     
     return NextResponse.json({ clients: data });
   }
   ```

## Production Checklist

Before going live, ensure:

- [ ] Environment variables are set correctly
- [ ] Google OAuth redirect URIs include production URL
- [ ] SSL certificate is installed (HTTPS)
- [ ] Database is configured (if using)
- [ ] Error tracking is set up (optional: Sentry)
- [ ] Analytics are configured (optional: Vercel Analytics)
- [ ] Rate limiting is enabled for API routes
- [ ] CORS is properly configured
- [ ] All API keys are secured
- [ ] Build completes without errors
- [ ] All features tested in production

## Monitoring & Maintenance

### Performance Monitoring

**With Vercel:**
- Enable Vercel Analytics in dashboard
- View real-time performance metrics
- Monitor API route response times

**Self-Hosted:**
```bash
# View PM2 logs
pm2 logs hero-hub

# Monitor performance
pm2 monit

# View error logs
pm2 logs hero-hub --err
```

### Updating the Application

**Vercel:**
- Push to GitHub
- Auto-deployment triggers
- Rollback available in dashboard

**Self-Hosted:**
```bash
cd /var/www/hero-hub
git pull
npm install
npm run build
pm2 restart hero-hub
```

### Backup Strategy

1. **Database Backups** (if using)
   - Set up automated backups in Supabase
   - Or use pg_dump for PostgreSQL
   
2. **Environment Variables**
   - Keep secure backup of `.env` file
   - Store in password manager

3. **Code**
   - Ensure GitHub repo is up to date
   - Tag releases for version control

## Scaling Considerations

### For High Traffic

1. **Enable Caching**
   - Use Redis for API response caching
   - Configure CDN for static assets

2. **Database Optimization**
   - Add indexes on frequently queried fields
   - Use connection pooling
   - Consider read replicas

3. **API Rate Limiting**
   - Implement rate limiting middleware
   - Use Redis for distributed rate limiting

4. **Multiple Instances**
   - Deploy behind load balancer
   - Use PM2 cluster mode
   - Or use Vercel's automatic scaling

### Cost Optimization

**Vercel Free Tier Includes:**
- Unlimited projects
- 100GB bandwidth/month
- 100 GB-hours serverless function execution

**Upgrade When:**
- Exceeding bandwidth limits
- Need team collaboration features
- Require custom domains with SSL

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Rotate secrets regularly
   - Use different credentials for production

2. **API Security**
   - All routes check authentication
   - Implement CSRF protection
   - Add rate limiting

3. **HTTPS Only**
   - Force HTTPS redirects
   - Use HSTS headers
   - Keep SSL certificates updated

4. **Google OAuth**
   - Limit scopes to necessary permissions
   - Review authorized apps regularly
   - Enable 2FA for admin accounts

## Troubleshooting Production Issues

### Build Failures
```bash
# Check Node version
node --version  # Should be 18+

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Authentication Errors
- Verify `NEXTAUTH_URL` matches actual URL
- Check Google OAuth redirect URIs
- Ensure `NEXTAUTH_SECRET` is set

### Performance Issues
- Check database query performance
- Monitor API response times
- Review Vercel/server logs
- Optimize images and assets

## Support

For deployment issues:
- Check Next.js deployment docs: https://nextjs.org/docs/deployment
- Vercel support: https://vercel.com/support
- Community Discord/forums

---

Ready to deploy? Start with Vercel for the easiest experience! 🚀


