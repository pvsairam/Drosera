# Vercel Deployment Guide

Complete guide to deploy Drosera Oracle Trap to Vercel with PostgreSQL database.

---

## Prerequisites

- ✅ GitHub repository: https://github.com/pvsairam/Drosera (pushed)
- ✅ Neon PostgreSQL database created
- ✅ Database migrations run
- ✅ Telegram bot token (optional)

---

## Step 1: Prepare Environment Variables

You'll need these values ready:

```bash
# Required
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/oracledb?sslmode=require

# Optional but recommended
SESSION_SECRET=your_random_32_char_string
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890

# Optional (emergency alerts only)
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_token_secret
```

**Generate SESSION_SECRET**:
```bash
openssl rand -base64 32
```

---

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. **Go to**: https://vercel.com/new
2. **Click** "Import Git Repository"
3. **Enter repository**: `https://github.com/pvsairam/Drosera`
4. **Click** "Import"

### 2.2 Configure Project

Vercel will auto-detect your settings:

- **Framework**: Vite ✅ (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**Click "Deploy"** without changing anything!

### 2.3 Add Environment Variables (During First Deploy)

**Option A: Add Now**
1. Expand **"Environment Variables"** section
2. Add each variable:

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | Your pooled Neon connection string | Production |
| `SESSION_SECRET` | Random 32-char string | Production |
| `TELEGRAM_BOT_TOKEN` | Your bot token | Production |
| `TELEGRAM_CHAT_ID` | Your chat ID | Production |

3. Click **"Deploy"**

**Option B: Add After Deploy**
1. Click **"Deploy"** to skip for now
2. After deployment, go to **Settings** → **Environment Variables**
3. Add variables there
4. **Redeploy** from Deployments tab

---

## Step 3: Verify Deployment

### 3.1 Check Build Logs

In Vercel deployment logs, look for:

```
✅ Building...
✅ Compiling...
✅ Build completed
✅ Deployment ready
```

### 3.2 Test Your App

1. Visit your deployment URL: `https://drosera-xyz.vercel.app`
2. Check dashboard loads
3. Test API endpoints:

```bash
# Replace with your actual Vercel URL
export VERCEL_URL="https://drosera-xyz.vercel.app"

# Test prices endpoint
curl $VERCEL_URL/api/prices

# Test incidents endpoint  
curl $VERCEL_URL/api/incidents

# Test chain status
curl $VERCEL_URL/api/status/chains
```

**Expected Response**:
```json
{
  "asset": "ETH",
  "symbol": "ETH",
  "chains": [...]
}
```

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Domain

1. Go to **Project Settings** → **Domains**
2. Click **"Add Domain"**
3. Enter your domain: `drosera.yourdomain.com`
4. Click **"Add"**

### 4.2 Update DNS

Add these DNS records to your domain provider:

**For subdomain** (e.g., `drosera.yourdomain.com`):
```
Type: CNAME
Name: drosera
Value: cname.vercel-dns.com
```

**For apex domain** (e.g., `yourdomain.com`):
```
Type: A
Name: @
Value: 76.76.21.21
```

### 4.3 Verify SSL

Vercel automatically provisions SSL certificates. Wait 5-10 minutes, then verify:

```bash
curl https://drosera.yourdomain.com/api/prices
```

---

## Step 5: Enable Auto-Deploy from GitHub

**Already enabled by default!** ✅

Every push to `main` branch automatically deploys to Vercel.

```bash
# Push to GitHub
git add .
git commit -m "Update oracle thresholds"
git push origin main

# Vercel automatically deploys in ~2 minutes
```

Monitor deployments: https://vercel.com/your-username/drosera/deployments

---

## Step 6: Monitor & Debug

### 6.1 View Logs

1. Go to **Deployments** tab
2. Click latest deployment
3. Click **"View Function Logs"**

Look for:
```
✅ Telegram bot initialized
✅ WebSocket server initialized
✅ Monitoring service started
✅ Fetched 48 prices from 2 ORACLE NETWORKS
```

### 6.2 Check Database Connection

In Function Logs, verify:
```
✅ Connected to PostgreSQL
✅ Database: oracledb
```

If you see errors:
- Check DATABASE_URL is correct (pooled connection)
- Verify Neon database is active
- Check Neon dashboard: https://console.neon.tech

### 6.3 Monitor Performance

**Vercel Analytics**:
- Go to **Analytics** tab
- View response times, errors, bandwidth

**Neon Monitoring**:
- Go to: https://console.neon.tech
- Select your project
- View **Monitoring** → Check connections, queries

---

## Environment-Specific Configuration

### Preview Deployments

Vercel creates preview deployments for all branches:

```bash
# Create feature branch
git checkout -b feature/new-detection

# Push to GitHub
git push origin feature/new-detection

# Vercel auto-creates preview: 
# https://drosera-xyz-git-feature-new-detection.vercel.app
```

**Add Preview Environment Variables**:
1. Go to **Settings** → **Environment Variables**
2. Add same variables but select **"Preview"** environment
3. Use a separate Neon branch for preview (optional):

```bash
# In Neon console, create branch "preview"
# Get preview connection string
# Add as DATABASE_URL for Preview environment
```

### Production vs Preview

| Environment | When Used | URL Pattern |
|-------------|-----------|-------------|
| **Production** | Main branch | `drosera-xyz.vercel.app` |
| **Preview** | Feature branches | `drosera-xyz-git-branch.vercel.app` |
| **Development** | Local machine | `localhost:5000` |

---

## Troubleshooting

### Error: "Build failed"

**Check**:
1. View build logs for specific error
2. Verify `package.json` has correct build script
3. Test build locally: `npm run build`

### Error: "Function timeout"

**Solution**: Vercel Hobby plan has 10s timeout
- Optimize database queries
- Add indexes to frequently queried columns
- Use connection pooling (already enabled with `-pooler` URL)

### Error: "Environment variable not found"

**Solution**:
1. Go to **Settings** → **Environment Variables**
2. Verify variable exists for **Production** environment
3. **Redeploy** after adding variables

### Database Connection Errors

**Check**:
- DATABASE_URL has `-pooler` in hostname (for connection pooling)
- DATABASE_URL ends with `?sslmode=require`
- Neon database is not suspended (visit console to wake it)

---

## Cost Breakdown

### Vercel Hobby Plan (Free)

| Resource | Limit |
|----------|-------|
| Bandwidth | 100 GB/month |
| Build Minutes | 6,000 minutes/month |
| Serverless Function Executions | 100 GB-hrs |
| Deployments | Unlimited |
| **Cost** | **$0/month** ✅ |

### Neon Free Tier

| Resource | Limit |
|----------|-------|
| Storage | 0.5 GB |
| Compute | 100 CU-hours/month |
| Auto-suspend | After 5 minutes |
| **Cost** | **$0/month** ✅ |

**Total Monthly Cost**: **$0** 🎉

---

## Production Checklist

- [ ] GitHub repository pushed
- [ ] Neon database created & migrated
- [ ] Environment variables added to Vercel
- [ ] First deployment successful
- [ ] API endpoints responding
- [ ] Database connection verified
- [ ] Telegram alerts working
- [ ] Custom domain configured (optional)
- [ ] Monitoring enabled

---

## Useful Commands

```bash
# View deployment logs
vercel logs <deployment-url>

# Pull environment variables locally
vercel env pull .env.local

# List all deployments
vercel ls

# Deploy to production manually
vercel --prod

# Rollback to previous deployment
vercel rollback <deployment-url>
```

---

**Your Drosera Oracle Trap is now live on Vercel!** 🚀

- **Dashboard**: https://your-vercel-url.vercel.app
- **API**: https://your-vercel-url.vercel.app/api/prices
- **Monitoring**: https://vercel.com/dashboard
