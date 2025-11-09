# Drosera Trap Deployment Commands

## ✅ Pre-Deployment Checklist

- [x] OraclePriceTrap.sol - Production ready
- [x] FlashLoanTrap.sol - Production ready  
- [x] No constructor parameters
- [x] Mainnet addresses hardcoded
- [x] Architect approved
- [x] Thresholds validated

**Total deployment cost**: ~$50-100 (gas only)

---

## 📤 STEP 1: Push to GitHub

Run this **single command** in your Replit shell:

```bash
git add contracts/*.sol contracts/interfaces/*.sol *.md drosera*.toml replit.md && git commit -m "Production-ready Drosera traps" && git push origin main
```

---

## 🖥️ STEP 2: VPS Deployment

SSH into your VPS and run this **single command**:

```bash
cd ~ && \
git clone YOUR_GITHUB_REPO_URL drosera-traps && \
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
```

**Replace** `YOUR_GITHUB_REPO_URL` with your actual GitHub repository URL.

---

## 🔧 If You Need Step-by-Step (Alternative)

### On Replit:
```bash
# Push code
git add contracts/*.sol contracts/interfaces/*.sol *.md drosera*.toml replit.md
git commit -m "Production-ready Drosera traps"
git push origin main
```

### On VPS:
```bash
# 1. Clone repo
cd ~
git clone YOUR_GITHUB_REPO_URL drosera-traps
cd drosera-traps

# 2. Install Solidity compiler
curl -fsSL https://github.com/ethereum/solidity/releases/download/v0.8.24/solc-static-linux -o /tmp/solc
sudo mv /tmp/solc /usr/local/bin/solc
sudo chmod +x /usr/local/bin/solc

# 3. Compile contracts
mkdir -p build/FlashLoanTrap build/OraclePriceTrap

solc --optimize --bin --abi contracts/FlashLoanTrap.sol \
  --base-path . \
  --include-path contracts \
  -o build/FlashLoanTrap

solc --optimize --bin --abi contracts/OraclePriceTrap.sol \
  --base-path . \
  --include-path contracts \
  -o build/OraclePriceTrap

# 4. Install Drosera CLI
curl -fsSL https://install.drosera.io | sh
export PATH="$HOME/.drosera/bin:$PATH"

# 5. Deploy Flash Loan Trap (first trap)
drosera apply --network mainnet -f drosera-flashloan.toml

# 6. Deploy Oracle Price Trap (second trap)
drosera apply --network mainnet -f drosera.toml
```

---

## 💰 Cost Breakdown

| Item | Cost |
|------|------|
| Flash Loan Trap deployment | ~$25-50 |
| Oracle Price Trap deployment | ~$25-50 |
| **Total** | **~$50-100** |

**Ongoing costs**: $0 (you're already a Drosera operator!)

---

## 📋 After Deployment

1. **Save trap addresses** from deployment output
2. **Configure Telegram bot** with TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID
3. **Monitor on Drosera dashboard**: `https://app.drosera.io/traps/<YOUR_ADDRESS>`
4. **Test alerts** by checking operator logs

---

## 🆘 Troubleshooting

**"solc: command not found"**
- Make sure you ran the curl command to download solc
- Check that `/usr/local/bin/solc` exists: `ls -l /usr/local/bin/solc`

**"drosera: command not found"**  
- Make sure you ran: `export PATH="$HOME/.drosera/bin:$PATH"`
- Or reload your shell: `source ~/.bashrc`

**"Transaction reverted"**
- Check you have at least 0.02 ETH in your deployer wallet
- Verify RPC endpoint is working: `curl https://eth.llamarpc.com`

**"Cannot find drosera.toml"**
- Make sure you're in the `drosera-traps` directory: `pwd`
- Check files exist: `ls -la drosera*.toml`

---

## 🎯 What Gets Deployed

### Flash Loan Trap
- **File**: `contracts/FlashLoanTrap.sol`
- **Config**: `drosera-flashloan.toml`
- **Monitors**: Aave V3 FlashLoan events
- **Alerts on**: Flash loans > $50M

### Oracle Price Trap  
- **File**: `contracts/OraclePriceTrap.sol`
- **Config**: `drosera.toml`
- **Monitors**: Pyth + Chainlink oracles
- **Alerts on**: Price manipulation, staleness

Both traps run **off-chain** via Drosera operators (zero ongoing gas!).

---

## ✅ Verification

After deployment, verify on Etherscan:
```bash
# Flash Loan Trap
https://etherscan.io/address/<FLASH_LOAN_TRAP_ADDRESS>

# Oracle Price Trap
https://etherscan.io/address/<ORACLE_PRICE_TRAP_ADDRESS>
```

Check that:
- [x] Contract is verified
- [x] No constructor parameters
- [x] Source code matches
- [x] Operator has opted in
