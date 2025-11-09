# Database Setup Guide - Neon PostgreSQL

Complete guide to set up production PostgreSQL database with Neon and deploy to Vercel.

---

## Step 1: Create Neon PostgreSQL Database (5 minutes)

### 1.1 Sign Up & Create Database

1. **Go to**: https://neon.com
2. **Sign up** with GitHub, Google, or email (no credit card required)
3. Click **"Create Project"**
4. Configure:
   - **Project Name**: `drosera-oracle-db`
   - **Database Name**: `oracledb`
   - **Region**: Choose closest to your users (e.g., `US East (Virginia)`)
5. Click **"Create Project"**

### 1.2 Get Connection String

After creation, you'll see a connection string like:

```
postgresql://username:password@ep-example-123456.us-east-2.aws.neon.tech/oracledb?sslmode=require
```

**Save both connection strings**:

1. **Pooled Connection** (for Vercel/production queries):
```
postgresql://user:pass@ep-example-123456-pooler.us-east-2.aws.neon.tech/oracledb?sslmode=require
```

2. **Direct Connection** (for migrations):
```
postgresql://user:pass@ep-example-123456.us-east-2.aws.neon.tech/oracledb?sslmode=require
```

> **Note**: Pooled URL has `-pooler` in the hostname - use this for production!

---

## Step 2: Run Database Migrations

### 2.1 Install Dependencies (if not already)

```bash
npm install
```

### 2.2 Set Local Environment Variable

Create `.env` file:

```bash
# Pooled connection for app queries
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/oracledb?sslmode=require"

# Direct connection for migrations
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/oracledb?sslmode=require"
```

> Replace with your actual Neon connection strings from Step 1.2

### 2.3 Generate & Run Migrations

```bash
# Generate migration files from schema
npm run db:generate

# Apply migrations to Neon database
npm run db:migrate
```

**Expected Output**:
```
✅ Migrations generated in drizzle/migrations/
✅ Applied 1 migration to database
```

### 2.4 Verify Tables Created

```bash
# Open Neon SQL Editor or run:
npm run db:studio
```

You should see these tables:
- `oracle_prices`
- `incidents`
- `asset_configs`
- `system_config`
- `chain_status`
- `simulation_scenarios`

---

## Step 3: Configure Vercel Environment Variables

### 3.1 Add Database URL to Vercel

1. **Go to**: https://vercel.com
2. Select your **Drosera** project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | Your **pooled** connection string | Production, Preview, Development |
| `DIRECT_DATABASE_URL` | Your **direct** connection string | Production, Preview, Development |
| `SESSION_SECRET` | Generate with: `openssl rand -base64 32` | Production, Preview |
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | Production |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID | Production |

### 3.2 Example Values

```bash
# Production Environment Variables (add in Vercel UI)
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/oracledb?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/oracledb?sslmode=require
SESSION_SECRET=your_random_32_char_string_here
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890

# Optional: Twitter credentials (emergency alerts only)
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_SECRET=your_token_secret
```

---

## Step 4: Update Storage Configuration

The app already uses Drizzle ORM with PostgreSQL. When `DATABASE_URL` is set, it automatically uses PostgreSQL instead of in-memory storage.

**No code changes needed!** The storage layer in `server/storage.ts` already handles this.

---

## Step 5: Deploy to Vercel

### 5.1 Deploy via GitHub Integration

1. **Go to**: https://vercel.com/new
2. **Import Repository**: Select `pvsairam/Drosera`
3. **Configure Project**:
   - Framework Preset: **Vite** (auto-detected)
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Click **"Deploy"**

### 5.2 Verify Deployment

After deployment:

1. **Check Build Logs**: Ensure no database connection errors
2. **Visit your app**: `https://drosera-xyz.vercel.app` (or your custom domain)
3. **Test API**: Visit `/api/prices` to verify database connection

---

## Step 6: Verify Everything Works

### 6.1 Test Database Connection

```bash
# On Vercel, check deployment logs for:
✅ Telegram bot initialized
✅ WebSocket server initialized
✅ Monitoring service started
✅ Fetched 48 prices from 2 ORACLE NETWORKS
```

### 6.2 Test API Endpoints

```bash
# Test prices endpoint
curl https://your-vercel-url.vercel.app/api/prices

# Test incidents endpoint
curl https://your-vercel-url.vercel.app/api/incidents

# Test health check
curl https://your-vercel-url.vercel.app/api/status/chains
```

### 6.3 Monitor Neon Dashboard

1. Go to: https://console.neon.tech
2. Select your project
3. Check **Monitoring** tab for:
   - Active connections
   - Query performance
   - Compute usage

---

## Database Schema Overview

Your Neon database will have these tables:

### `oracle_prices`
- Stores real-time price data from Pyth & RedStone
- Columns: id, chain, asset, symbol, price, source, timestamp, confidence, deviation

### `incidents`
- Stores detected anomalies
- Columns: id, type, severity, chain, asset, timestamp, acknowledged, price data, alert status

### `asset_configs`
- Asset-specific thresholds
- Columns: asset, symbol, volatility_class, networks, thresholds, enabled

### `system_config`
- Global configuration
- Columns: guardian_enabled, monitoring_interval, alert settings

### `chain_status`
- Network health tracking
- Columns: chain, is_healthy, last_successful_fetch, error_count

### `simulation_scenarios`
- Attack simulation scenarios
- Columns: name, description, chain, asset, price_manipulation, detection_delay

---

## Free Tier Limits

Neon Free Tier includes:
- ✅ **Storage**: 0.5 GB per project
- ✅ **Compute**: 100 CU-hours per month
- ✅ **Branches**: 10 branches (great for dev/staging)
- ✅ **Auto-suspend**: After 5 minutes of inactivity
- ✅ **Scale-to-zero**: No charges when idle

**Estimated Usage for Drosera**:
- Storage: ~50 MB (prices + incidents)
- Compute: ~20 CU-hours/month (with auto-suspend)
- **Cost**: $0/month on free tier ✅

---

## Troubleshooting

### Error: "Connection timeout"

**Solution**: Check Neon status at https://neon.com/status

### Error: "SSL certificate problem"

**Solution**: Add `?sslmode=require` to connection string

### Error: "Too many connections"

**Solution**: You're using direct URL instead of pooled URL. Switch to `-pooler` URL.

### Migration Fails

```bash
# Reset migrations (⚠️ WARNING: Drops all data!)
npm run db:drop
npm run db:generate
npm run db:migrate
```

---

## Production Checklist

- [ ] Neon database created
- [ ] Connection strings saved
- [ ] Migrations run successfully
- [ ] Environment variables added to Vercel
- [ ] Vercel deployment successful
- [ ] API endpoints responding
- [ ] Telegram alerts working
- [ ] Monitoring service active

---

**You're ready for production!** Your Drosera Oracle Trap now has a serverless PostgreSQL database with automatic scaling and zero-downtime deployments. 🚀
