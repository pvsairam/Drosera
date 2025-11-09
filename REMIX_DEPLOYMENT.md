# Deploy Contract via Remix IDE

Complete guide to deploy OraclePriceTrap.sol to Ethereum using Remix.

---

## Step 1: Load All Contract Files into Remix

### Method A: Load from GitHub (Easiest)

1. **Go to**: https://remix.ethereum.org
2. Click **"Clone"** button (GitHub icon) in File Explorer
3. Enter repository URL:
   ```
   https://github.com/pvsairam/Drosera
   ```
4. Click **"Clone"**
5. Navigate to `contracts/` folder

### Method B: Manual Upload

If GitHub method doesn't work:

1. **Create folder structure** in Remix:
   ```
   contracts/
   ├── Trap.sol
   ├── OraclePriceTrap.sol
   └── interfaces/
       ├── IPyth.sol
       └── IRedStone.sol
   ```

2. **Copy file contents** from GitHub:
   - Go to: https://github.com/pvsairam/Drosera/tree/main/contracts
   - Copy each file content
   - Create corresponding file in Remix and paste

**Required Files**:
- ✅ `contracts/Trap.sol` (base contract)
- ✅ `contracts/OraclePriceTrap.sol` (main contract)
- ✅ `contracts/interfaces/IPyth.sol`
- ✅ `contracts/interfaces/IRedStone.sol`

---

## Step 2: Compile Contract

1. **Open** `contracts/OraclePriceTrap.sol` in Remix
2. **Go to** "Solidity Compiler" tab (left sidebar)
3. **Configure**:
   - Compiler: `0.8.24+commit.e11b9ed9`
   - EVM Version: `paris`
   - Enable Optimization: ✅ **Checked**
   - Runs: `200`
4. Click **"Compile OraclePriceTrap.sol"**
5. **Verify**: Green checkmark appears ✅

**Expected Output**:
```
✅ Compilation successful
✅ Contract: OraclePriceTrap
✅ No warnings
```

---

## Step 3: Deploy to Ethereum Mainnet

### 3.1 Connect MetaMask

1. **Go to** "Deploy & Run Transactions" tab
2. **Environment**: Select "Injected Provider - MetaMask"
3. **Account**: Ensure your wallet with ETH is connected
4. **Network**: Verify MetaMask shows "Ethereum Mainnet"

### 3.2 Configure Constructor Parameters

**Contract**: Select `OraclePriceTrap`

**Constructor Arguments** (in order):

| Parameter | Value | Description |
|-----------|-------|-------------|
| `_pythContract` | `0x4305FB66699C3B2702D4d05CF36551390A4c69C6` | Pyth Network mainnet |
| `_pythPriceId` | `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` | ETH/USD price feed |
| `_redstoneContract` | `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419` | RedStone/Chainlink ETH/USD |

**Copy-paste format** for Remix:
```
"0x4305FB66699C3B2702D4d05CF36551390A4c69C6","0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace","0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
```

### 3.3 Deploy

1. **Gas Limit**: Leave as auto (Remix will estimate)
2. **Value**: `0` ETH (no payment needed)
3. Click **"Deploy"** (orange button)
4. **MetaMask** will pop up:
   - Review gas fee (~$50-100 depending on network)
   - Click **"Confirm"**
5. **Wait** for transaction to confirm (1-2 minutes)

---

## Step 4: Verify Deployment

After deployment succeeds:

1. **Copy contract address** from Remix deployed contracts list
2. **Go to**: https://etherscan.io/address/YOUR_CONTRACT_ADDRESS
3. **Verify** you see:
   - Contract creation transaction ✅
   - Balance: 0 ETH ✅
   - Code: Contract bytecode ✅

**Save this address!** You'll need it for:
- Vercel environment variables
- Drosera registration

---

## Step 5: Test Contract (Optional)

In Remix deployed contracts panel, test functions:

### Test `collect()` function:

1. Expand deployed contract
2. Click **"collect"** button (blue - view function)
3. **Expected**: Returns bytes data ✅

### Test `shouldAlert()` function:

1. Call `collect()` first to get data
2. Copy returned bytes
3. Call `shouldAlert(bytes)` with that data
4. **Expected**: Returns `false` (no alert) ✅

### Check configuration:

```javascript
pythContract()      // Should return: 0x4305FB66699C3B2702D4d05CF36551390A4c69C6
redstoneContract()  // Should return: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
pythPriceId()       // Should return: 0xff61491a...fd0ace
```

---

## Troubleshooting

### Error: "File not found: IRedStone.sol"

**Solution**: Make sure all files are in correct folders:
- `contracts/interfaces/IRedStone.sol` ✅
- `contracts/interfaces/IPyth.sol` ✅

### Error: "Compilation failed"

**Solution**: Check Solidity version is exactly `0.8.24`

### Error: "Out of gas"

**Solution**: 
- Increase gas limit in MetaMask
- Wait for lower gas prices (check https://etherscan.io/gastracker)
- Try during off-peak hours (weekends, late night UTC)

### Error: "Insufficient funds"

**Solution**: You need ~0.05 ETH for deployment gas

---

## After Deployment Checklist

- [ ] Contract deployed successfully
- [ ] Contract address saved
- [ ] Tested `collect()` function works
- [ ] Added contract address to `.env`:
  ```
  GUARDIAN_CONTRACT_ADDRESS=0xYourContractAddress
  GUARDIAN_NETWORK=ethereum
  ```
- [ ] Ready to register with Drosera (when available)

---

## Next Steps

1. ✅ **Verify on Etherscan** (optional but recommended)
2. ✅ **Update Vercel** environment variables with contract address
3. ✅ **Register with Drosera** when they launch on Ethereum mainnet

---

**Your trap contract is now live on Ethereum!** 🎉

The contract will:
- Monitor ETH/USD prices from Pyth and RedStone
- Detect 15%+ price deviations
- Alert on stale data (>1 hour old)
- Cost: $0/month ongoing (operators run it off-chain)
