#!/bin/bash
# Drosera Flash Loan Trap - Deployment Commands

# ============================================
# COMMAND 1: Delete Git History & Push to GitHub
# ============================================
# WARNING: This will delete ALL commit history!

delete_history_and_push() {
  echo "⚠️  WARNING: This will delete ALL commit history!"
  echo "Creating fresh repository..."
  
  # Remove git history
  rm -rf .git
  
  # Initialize new repo
  git init
  git add .
  git commit -m "Deploy: Flash Loan Trap with corrected uint8 event signature"
  
  # Add GitHub remote (replace with your repo URL)
  git remote add origin https://github.com/pvsairam/Drosera.git
  
  # Force push to main branch
  git branch -M main
  git push -u origin main --force
  
  echo "✅ Fresh repository pushed to GitHub!"
}

# ============================================
# COMMAND 2: Deploy to Ethereum Mainnet
# ============================================

deploy_mainnet() {
  echo "🚀 Deploying Flash Loan Trap to Ethereum Mainnet..."
  export PRIVATE_KEY="$PRIVATE_KEY"
  node scripts/deploy-mainnet.js
}

# ============================================
# Usage:
# ============================================
# Run command 1: bash DEPLOYMENT_COMMANDS.sh delete_history
# Run command 2: bash DEPLOYMENT_COMMANDS.sh deploy_mainnet
# ============================================

case "$1" in
  delete_history)
    delete_history_and_push
    ;;
  deploy_mainnet)
    deploy_mainnet
    ;;
  *)
    echo "Usage: bash DEPLOYMENT_COMMANDS.sh [delete_history|deploy_mainnet]"
    ;;
esac
