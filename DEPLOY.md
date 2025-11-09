# Deployment Guide

## Step 1: Deploy Smart Contract to Ethereum Mainnet

### Prerequisites
- ~0.05 ETH in your wallet (for deployment gas)
- Private key exported to environment

### Deploy Command

```bash
PRIVATE_KEY=0x... tsx scripts/deploy-ethereum.ts
```

**Expected Cost**: $50-100 (depending on gas prices)

**What happens**:
1. Compiles `OraclePriceTrap.sol` with optimization
2. Deploys to Ethereum mainnet
3. Outputs contract address
4. Shows deployment cost

**Save the contract address** - you'll need it for Drosera registration!

---

## Step 2: Push Code to GitHub

### One-Command Push

```bash
./push-to-github.sh
```

This script will:
- ✅ Initialize git repository
- ✅ Add remote: https://github.com/pvsairam/Drosera.git
- ✅ Stage all files (excluding attached_assets, .replit, etc via .gitignore)
- ✅ Create descriptive commit
- ✅ Push to GitHub main branch

### Manual Alternative

```bash
git init
git remote add origin https://github.com/pvsairam/Drosera.git
git add -A
git commit -m "Initial commit: Drosera Oracle Trap"
git branch -M main
git push -u origin main --force
```

---

## Step 3: Deploy Frontend to Vercel

### Quick Deploy (Recommended)

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Enter: `https://github.com/pvsairam/Drosera`
4. Click "Import"
5. Vercel auto-detects Vite configuration ✅
6. Click "Deploy"

**Done!** Your frontend will be live at: `https://drosera-xyz.vercel.app` (or similar)

### Configuration

Vercel will use `vercel.json` which is already configured:
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist`
- ✅ Framework: Vite (auto-detected)

### Environment Variables (Optional)

If you want backend API integration on Vercel:

1. Go to Project Settings → Environment Variables
2. Add:
   - `VITE_API_URL` = Your backend URL (e.g., `https://api.yourdomain.com`)

---

## Step 4: Register with Drosera (After Contract Deployment)

Once your contract is deployed to Ethereum:

```bash
drosera apply --network ethereum --contract <YOUR_CONTRACT_ADDRESS>
```

This registers your trap with Drosera operators.

---

## Step 5: Start Backend Monitoring (Optional)

### On Your Server (Ubuntu/VPS)

```bash
# Clone repo
git clone https://github.com/pvsairam/Drosera.git
cd Drosera

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start monitoring
npm run dev
```

### Environment Variables for Backend

```bash
# Telegram alerts (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Contract address (from Step 1)
GUARDIAN_CONTRACT_ADDRESS=0x...
GUARDIAN_NETWORK=ethereum
```

---

## Final Architecture

After deployment, you'll have:

1. **Smart Contract** (Ethereum Mainnet)
   - Deployed at your contract address
   - Monitored by Drosera operators
   - Cost: $50-100 one-time, $0/month

2. **Frontend** (Vercel)
   - Live at: https://drosera-xyz.vercel.app
   - Auto-deploys on GitHub pushes
   - Cost: $0/month (Vercel free tier)

3. **Backend** (Your server - optional)
   - Running on your VPS
   - Fetches oracle prices
   - Sends Telegram alerts
   - Cost: Depends on your VPS

---

## Verification

### Verify Contract Deployed

https://etherscan.io/address/YOUR_CONTRACT_ADDRESS

### Verify GitHub Pushed

https://github.com/pvsairam/Drosera

### Verify Frontend Deployed

https://your-vercel-url.vercel.app

### Verify Backend Running

```bash
curl http://localhost:5000/api/prices
```

---

## Next Steps

1. ✅ Deploy contract to Ethereum
2. ✅ Push code to GitHub
3. ✅ Deploy frontend to Vercel
4. ✅ Register with Drosera
5. ✅ Start backend monitoring (optional)

**Your Drosera Oracle Trap is now live!** 🚀
