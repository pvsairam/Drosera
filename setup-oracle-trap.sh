#!/bin/bash
set -e

echo "🚀 Setting up Drosera Oracle Price Trap..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Create directory
echo -e "${BLUE}📁 Creating oracle-price-trap directory...${NC}"
cd ~
mkdir -p oracle-price-trap
cd oracle-price-trap

# Step 2: Create directory structure
echo -e "${BLUE}📂 Creating directory structure...${NC}"
mkdir -p contracts/interfaces

# Step 3: Download contract files from GitHub
echo -e "${BLUE}⬇️  Downloading contract files from GitHub...${NC}"

# Download main contracts
wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/OraclePriceTrap.sol -O contracts/OraclePriceTrap.sol
wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/Trap.sol -O contracts/Trap.sol

# Download interfaces
wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/interfaces/IPyth.sol -O contracts/interfaces/IPyth.sol
wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/interfaces/IRedStone.sol -O contracts/interfaces/IRedStone.sol

echo -e "${GREEN}✅ Contract files downloaded${NC}"

# Step 4: Create foundry.toml
echo -e "${BLUE}⚙️  Creating foundry.toml...${NC}"
cat > foundry.toml << 'EOF'
# Foundry configuration for Drosera Oracle Price Trap
[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"

# Optimizer settings
optimizer = true
optimizer_runs = 200

# Test settings
verbosity = 3

# RPC endpoints
[rpc_endpoints]
mainnet = "https://eth-mainnet.g.alchemy.com/v2/nqOL9QkKfaj39Zi4NIUxJqAbggi3cYix"
EOF

echo -e "${GREEN}✅ foundry.toml created${NC}"

# Step 5: Create drosera.toml
echo -e "${BLUE}⚙️  Creating drosera.toml...${NC}"
cat > drosera.toml << 'EOF'
# Drosera Oracle Price Trap Configuration
ethereum_rpc = "https://eth-mainnet.g.alchemy.com/v2/nqOL9QkKfaj39Zi4NIUxJqAbggi3cYix"
eth_chain_id = 1

[traps.oracle_price]
path = "out/OraclePriceTrap.sol/OraclePriceTrap.json"
cooldown_period_blocks = 100
min_number_of_operators = 1
max_number_of_operators = 10
private_trap = true
whitelist = ["0xF9810b951d45D19754435D8e44b7761aA1635D72"]

# Constructor arguments for OraclePriceTrap:
# 1. Pyth contract address (Ethereum mainnet)
# 2. ETH/USD price feed ID
# 3. Chainlink ETH/USD aggregator (used as RedStone alternative)
constructor_args = [
    "0x4305FB66699C3B2702D4d05CF36551390A4c69C6",
    "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
]
EOF

echo -e "${GREEN}✅ drosera.toml created${NC}"

# Step 6: Compile contracts
echo -e "${BLUE}🔨 Compiling contracts with Forge...${NC}"
if command -v forge &> /dev/null; then
    forge build
    echo -e "${GREEN}✅ Contracts compiled successfully${NC}"
else
    echo -e "${RED}⚠️  Forge not found. Please install Foundry first:${NC}"
    echo "   curl -L https://foundry.paradigm.xyz | bash"
    echo "   foundryup"
    echo ""
    echo "   Then run: cd ~/oracle-price-trap && forge build"
fi

# Step 7: Summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📂 Project location:${NC} ~/oracle-price-trap"
echo ""
echo -e "${BLUE}📝 Next steps:${NC}"
echo "   1. cd ~/oracle-price-trap"
echo "   2. DROSERA_PRIVATE_KEY=0xYourPrivateKey drosera apply"
echo ""
echo -e "${BLUE}📋 Files created:${NC}"
echo "   ✅ contracts/OraclePriceTrap.sol"
echo "   ✅ contracts/Trap.sol"
echo "   ✅ contracts/interfaces/IPyth.sol"
echo "   ✅ contracts/interfaces/IRedStone.sol"
echo "   ✅ foundry.toml"
echo "   ✅ drosera.toml"
echo "   ✅ out/OraclePriceTrap.sol/OraclePriceTrap.json (compiled)"
echo ""
echo -e "${BLUE}🎯 Deployment addresses configured:${NC}"
echo "   • Pyth Oracle: 0x4305FB66699C3B2702D4d05CF36551390A4c69C6"
echo "   • Chainlink ETH/USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
echo "   • Operator whitelist: 0xF9810b951d45D19754435D8e44b7761aA1635D72"
echo ""
echo -e "${GREEN}🚀 Ready to deploy with: drosera apply${NC}"
echo ""
