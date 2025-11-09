# Flash Loan Trap - Sepolia Testnet Deployment Guide

## ✅ What Was Fixed

We've corrected **3 critical bugs** in the FlashLoanTrap contract:

1. **Event Signature** - Changed `uint256` to `uint8` for `interestRateMode` (verified against Aave V3 source code)
2. **Event String** - Updated signature string to match
3. **ABI Decode Types** - Fixed decode tuple to use `uint8`

**Status**: ✅ Ready for deployment

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] Sepolia ETH for gas (get from [Sepolia Faucet](https://sepoliafaucet.com))
- [ ] Private key with PRIVATE_KEY environment variable set
- [ ] Node.js 18+ and npm installed

---

## 🚀 Deployment Steps

### Option 1: Deploy via Hardhat (Recommended)

```bash
# 1. Install dependencies (with legacy peer deps to avoid conflicts)
npm install --legacy-peer-deps dotenv

# 2. Set your private key
export PRIVATE_KEY="0x..."  # Your deployer private key

# 3. Compile contracts
npx hardhat compile

# 4. Deploy to Sepolia
npx hardhat run scripts/deploySepolia.ts --network sepolia
```

The script will:
- Deploy FlashLoanTrap with Sepolia configuration
- Monitor 3 assets: WETH (1 ETH threshold), USDC (1000 threshold), DAI (1000 threshold)
- Save deployment info to `deployment-sepolia.json`

---

### Option 2: Deploy via Remix IDE (Easiest)

1. **Open Remix**: Go to [remix.ethereum.org](https://remix.ethereum.org)

2. **Load Contract**: 
   - Create new file: `FlashLoanTrap.sol`
   - Copy contract from: `contracts/FlashLoanTrap.sol`
   - Create another file: `Trap.sol`
   - Copy from: `contracts/Trap.sol`

3. **Compile**:
   - Select compiler 0.8.24
   - Enable optimization (200 runs)
   - Click "Compile FlashLoanTrap.sol"

4. **Deploy**:
   - Switch to "Deploy & Run Transactions" tab
   - Select "Injected Provider - MetaMask"
   - Switch MetaMask to Sepolia network
   - Enter constructor parameters:

```
_pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951

_assets: [
  ["0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c", "1000000000000000000", "WETH"],
  ["0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8", "1000000000", "USDC"],
  ["0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357", "1000000000000000000000", "DAI"]
]
```

   - Click "Deploy"
   - Confirm transaction in MetaMask

---

## 🧪 Testing the Deployment

### Step 1: Get Test Tokens

1. Visit [app.aave.com](https://app.aave.com)
2. Enable testnet mode (gear icon, top right)
3. Switch to Sepolia network
4. Go to "Faucet" tab
5. Mint test tokens (WETH, USDC, DAI)

### Step 2: Execute a Test Flash Loan

You'll need to create a simple flash loan receiver contract or use an existing one. Here's a basic example:

```solidity
// TestFlashLoanReceiver.sol
contract TestFlashLoanReceiver {
    IPool public pool = IPool(0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951);
    
    function testFlashLoan() external {
        address[] memory assets = new address[](1);
        assets[0] = 0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c; // WETH
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 2 * 1e18; // 2 WETH (exceeds 1 WETH threshold)
        
        pool.flashLoanSimple(
            address(this),
            assets[0],
            amounts[0],
            "",
            0
        );
    }
    
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {
        // Approve pool to pull funds back
        IERC20(asset).approve(address(pool), amount + premium);
        return true;
    }
}
```

### Step 3: Monitor Events

After executing the flash loan:

1. Check Sepolia Etherscan for the flash loan transaction
2. Look for `FlashLoan` event emission from Aave V3 Pool
3. Verify your FlashLoanTrap contract detected it (check logs)

---

## 📊 Network Configuration

| Item | Address/Value |
|------|--------------|
| **Network** | Sepolia Testnet |
| **Chain ID** | 11155111 |
| **Aave V3 Pool** | `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951` |
| **WETH** | `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c` |
| **USDC** | `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8` |
| **DAI** | `0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357` |

### Detection Thresholds (Sepolia)

- WETH: 1 ETH
- USDC: 1,000 USDC
- DAI: 1,000 DAI

---

## 🔍 Verifying the Contract

After deployment, verify on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> \
  "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951" \
  '[["0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c","1000000000000000000","WETH"],["0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8","1000000000","USDC"],["0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357","1000000000000000000000","DAI"]]'
```

---

## ✅ Deployment Checklist

After successful deployment:

- [ ] Contract deployed to Sepolia
- [ ] Verified on Etherscan
- [ ] Got test tokens from Aave faucet
- [ ] Executed test flash loan transaction
- [ ] Verified event detection works
- [ ] Documented contract address
- [ ] Ready to deploy to mainnet

---

## 🚨 Common Issues

### Issue: "Insufficient funds"
**Solution**: Get Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

### Issue: "Transaction failed"
**Solution**: Increase gas limit or check constructor parameters are correct

### Issue: "Contract not detecting events"
**Solution**: 
- Verify event signature is correct (uint8, not uint256)
- Check flash loan amount exceeds threshold
- Ensure monitoring correct pool address

---

## 📞 Next Steps

Once Sepolia testing is successful:

1. Review test results
2. Adjust thresholds if needed
3. Deploy to Ethereum mainnet
4. Register with Drosera operators

---

## 🔗 Useful Links

- [Aave V3 Testnet](https://app.aave.com)
- [Sepolia Faucet](https://sepoliafaucet.com)
- [Sepolia Etherscan](https://sepolia.etherscan.io)
- [Remix IDE](https://remix.ethereum.org)
- [Hardhat Docs](https://hardhat.org/docs)

