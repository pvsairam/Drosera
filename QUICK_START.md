# Quick Start Guide

Get Drosera Oracle Trap running in production in under 15 minutes.

---

## 🚀 3-Step Deployment

### Step 1: Setup Database (5 min)

1. **Create Neon account**: https://neon.com (free, no credit card)
2. **Create project**:
   - Name: `drosera-oracle-db`
   - Database: `oracledb`
   - Region: US East (or closest to you)
3. **Copy connection strings** (both pooled and direct)
4. **Set environment variable**:
   ```bash
   export DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/oracledb?sslmode=require"
   ```
5. **Run migrations**:
   ```bash
   ./setup-database.sh
   ```

### Step 2: Deploy to Vercel (3 min)

1. **Go to**: https://vercel.com/new
2. **Import**: `https://github.com/pvsairam/Drosera`
3. **Add environment variables**:
   - `DATABASE_URL`: Your Neon pooled connection string
   - `SESSION_SECRET`: Generate with `openssl rand -base64 32`
   - `TELEGRAM_BOT_TOKEN`: Your bot token (optional)
   - `TELEGRAM_CHAT_ID`: Your chat ID (optional)
4. **Click "Deploy"**

### Step 3: Deploy Contract (Manual via Remix)

1. **Open**: https://remix.ethereum.org
2. **Load contracts** from GitHub:
   - `contracts/OraclePriceTrap.sol`
   - `contracts/Trap.sol`
   - `contracts/interfaces/*`
3. **Compile** with Solidity 0.8.24 + optimizer
4. **Deploy to Ethereum** with MetaMask:
   - Pyth: `0x4305FB66699C3B2702D4d05CF36551390A4c69C6`
   - RedStone: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
   - ETH/USD: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
5. **Save contract address** for Drosera registration

---

## ✅ Verification

### Test Deployment

```bash
# Replace with your Vercel URL
export APP_URL="https://your-app.vercel.app"

# Test API
curl $APP_URL/api/prices
curl $APP_URL/api/incidents
curl $APP_URL/api/status/chains

# Expected: JSON responses with oracle data
```

### Check Logs

**Vercel**: https://vercel.com/dashboard → Deployments → View Logs

Look for:
```
✅ Telegram bot initialized
✅ Monitoring service started
✅ Fetched 48 prices from 2 ORACLE NETWORKS
```

**Neon**: https://console.neon.tech → Monitoring

Look for:
- Active connections
- Query activity
- No errors

---

## 📊 What You Get

| Component | Status | Cost |
|-----------|--------|------|
| **Frontend Dashboard** | ✅ Live on Vercel | $0/month |
| **Backend API** | ✅ Serverless functions | $0/month |
| **PostgreSQL Database** | ✅ Neon serverless | $0/month |
| **Contract (Testnet)** | ✅ Sepolia: 0x398...2f6 | $0/month |
| **Contract (Mainnet)** | ⏳ Deploy when ready | ~$50-100 one-time |
| **Monitoring** | ✅ 48 prices/sec | $0/month |
| **Telegram Alerts** | ✅ Real-time | $0/month |

**Total Ongoing Cost**: **$0/month** 🎉

---

## 🔧 Configuration

### Enable Telegram Alerts

1. **Create bot**: Message @BotFather on Telegram
2. **Get token**: Starts with `1234567890:ABC...`
3. **Get chat ID**: Message @userinfobot
4. **Add to Vercel**:
   - Go to Settings → Environment Variables
   - Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
   - Redeploy

### Adjust Detection Thresholds

**Via API**:
```bash
curl -X PATCH $APP_URL/api/config/system \
  -H "Content-Type: application/json" \
  -d '{"detectionThreshold": 1500}'  # 15% deviation
```

**Via Database**:
```bash
# Open Neon SQL Editor
# Update system_config table
```

---

## 📚 Full Documentation

For detailed guides, see:

- **Database Setup**: `DATABASE_SETUP.md`
- **Vercel Deployment**: `VERCEL_DEPLOY.md`
- **Contract Deployment**: `DEPLOY.md`
- **Architecture**: `README.md`

---

## 🆘 Need Help?

### Common Issues

**"Database connection failed"**
→ Check DATABASE_URL has `-pooler` and `?sslmode=require`

**"Build failed on Vercel"**
→ Check build logs, verify all dependencies in package.json

**"No price data showing"**
→ Check Vercel function logs for API errors

### Get Support

- **GitHub Issues**: https://github.com/pvsairam/Drosera/issues
- **Neon Support**: https://neon.com/docs
- **Vercel Support**: https://vercel.com/support

---

**You're all set!** Your oracle monitoring system is now live with zero ongoing costs. 🚀
