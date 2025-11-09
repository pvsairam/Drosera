#!/bin/bash
# ================================================================
# GIT PUSH COMMANDS FOR DROSERA TRAPS
# ================================================================

# ================================================================
# OPTION 1: FRESH START (What you asked for) 🔥
# ================================================================
# ⚠️  WARNING: This DESTROYS all existing git history!
# ⚠️  Use only if you want a completely fresh repository
# ================================================================

rm -rf .git
git init
git add .
git commit -m "Production-ready Drosera security traps: Oracle + Flash Loan detection"
git branch -M main
git remote add origin https://github.com/pvsairam/drosera-oracle-trap.git
git push -u origin main --force

# ================================================================
# OPTION 2: SAFE PUSH (Recommended) ✅
# ================================================================
# Keeps existing history, just adds new commits
# ================================================================

# git add contracts/*.sol contracts/interfaces/*.sol *.md drosera*.toml replit.md
# git commit -m "Production-ready Drosera traps: Oracle + Flash Loan detection"
# git push origin main

# ================================================================
# WHAT TO DO:
# ================================================================
# 1. Edit the repository URL above (line 15)
#    Replace: https://github.com/pvsairam/drosera-oracle-trap.git
#    With your actual GitHub repo URL
#
# 2. Choose ONE option:
#    - OPTION 1: Copy lines 14-18 (fresh start)
#    - OPTION 2: Copy lines 27-29 (safe push)
#
# 3. Paste in Replit shell and run
# ================================================================

# ================================================================
# THEN ON YOUR VPS:
# ================================================================

# Replace YOUR_REPO_URL with the URL you used above

cd ~ && \
git clone YOUR_REPO_URL drosera-traps && \
cd drosera-traps && \
curl -fsSL https://github.com/ethereum/solidity/releases/download/v0.8.24/solc-static-linux -o /tmp/solc && \
sudo mv /tmp/solc /usr/local/bin/solc && \
sudo chmod +x /usr/local/bin/solc && \
mkdir -p build/FlashLoanTrap build/OraclePriceTrap && \
solc --optimize --bin --abi contracts/FlashLoanTrap.sol --base-path . --include-path contracts -o build/FlashLoanTrap && \
solc --optimize --bin --abi contracts/OraclePriceTrap.sol --base-path . --include-path contracts -o build/OraclePriceTrap && \
curl -fsSL https://install.drosera.io | sh && \
export PATH="$HOME/.drosera/bin:$PATH" && \
drosera apply --network mainnet -f drosera-flashloan.toml && \
drosera apply --network mainnet -f drosera.toml

# ================================================================
# ESTIMATED COST: ~$50-100 (gas only)
# ================================================================
