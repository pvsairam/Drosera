#!/bin/bash

# Push Drosera Oracle Trap to GitHub
# Usage: ./push-to-github.sh

echo "🚀 Pushing to GitHub: https://github.com/pvsairam/Drosera.git"
echo ""

# Initialize git if not already initialized
if [ ! -d .git ]; then
  echo "📦 Initializing git repository..."
  git init
fi

# Configure git user (required for commits)
echo "👤 Configuring git user..."
git config user.name "pvsairam" 2>/dev/null || git config --global user.name "pvsairam"
git config user.email "pvsairam@users.noreply.github.com" 2>/dev/null || git config --global user.email "pvsairam@users.noreply.github.com"

# Set remote
echo "🔗 Setting GitHub remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/pvsairam/Drosera.git

# Stage files (gitignore handles exclusions)
echo "📝 Staging files..."
git add -A

# Commit
echo "💾 Creating commit..."
git commit -m "feat: Drosera Oracle Price Monitoring Trap

- Multi-chain oracle monitoring (Ethereum, Arbitrum, Optimism, Base, Polygon, Solana)
- On-chain trap contract for Drosera network
- Off-chain statistical detection engine
- Real-time alerts via Telegram
- React dashboard with WebSocket updates
- Zero ongoing gas costs

Deployment:
- Sepolia testnet: 0x39849c938cF5142e01EF307FaF757F13A01682f6
- Ready for Ethereum mainnet deployment

Tech Stack:
- Solidity 0.8.24 (trap contract)
- Node.js + TypeScript + Express (backend)
- React + TypeScript + Tailwind CSS (frontend)
- Pyth Network + RedStone Finance (oracle data)
- PostgreSQL + Drizzle ORM (optional storage)
"

# Push to GitHub
echo "🚢 Pushing to GitHub..."
echo ""
echo "⚠️  AUTHENTICATION REQUIRED:"
echo "Choose one of these methods:"
echo ""
echo "Option 1: GitHub Personal Access Token (Recommended)"
echo "  1. Go to: https://github.com/settings/tokens/new"
echo "  2. Give token name: 'Drosera Deploy'"
echo "  3. Select scope: 'repo' (full control)"
echo "  4. Click 'Generate token'"
echo "  5. Copy the token (starts with ghp_...)"
echo "  6. When prompted for password, paste the token"
echo ""
echo "Option 2: GitHub CLI (Easier)"
echo "  Run: gh auth login"
echo "  Then re-run this script"
echo ""
echo "Option 3: SSH Key"
echo "  Add SSH key to GitHub, then use SSH URL instead"
echo ""

git branch -M main
git push -u origin main --force

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Successfully pushed to GitHub!"
  echo "🔗 View at: https://github.com/pvsairam/Drosera"
  echo ""
  echo "📋 Next steps:"
  echo "1. Go to GitHub and verify the files"
  echo "2. Deploy frontend to Vercel: https://vercel.com/new"
  echo "3. Connect your GitHub repo (pvsairam/Drosera)"
  echo "4. Vercel will auto-detect Vite and deploy"
else
  echo ""
  echo "❌ Push failed. Please authenticate using one of the methods above."
  echo ""
  echo "Quick fix: Create a Personal Access Token"
  echo "  1. Visit: https://github.com/settings/tokens/new"
  echo "  2. Name: 'Drosera Deploy'"
  echo "  3. Scopes: Check 'repo'"
  echo "  4. Generate token"
  echo "  5. Re-run: ./push-to-github.sh"
  echo "  6. When prompted for password, paste your token"
  echo ""
fi
