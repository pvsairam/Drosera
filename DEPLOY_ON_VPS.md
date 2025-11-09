# 🚀 Deploy Oracle Price Trap on VPS (Mobile-Friendly)

## One-Command Setup

Copy and paste this in your VPS terminal (works on Termius mobile):

```bash
cd ~ && mkdir -p oracle-price-trap && cd oracle-price-trap && mkdir -p contracts/interfaces && wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/OraclePriceTrap.sol -O contracts/OraclePriceTrap.sol && wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/Trap.sol -O contracts/Trap.sol && wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/interfaces/IPyth.sol -O contracts/interfaces/IPyth.sol && wget -q https://raw.githubusercontent.com/pvsairam/Drosera/main/contracts/interfaces/IRedStone.sol -O contracts/interfaces/IRedStone.sol && cat > foundry.toml << 'EOF'
[profile.default]
src = "contracts"
out = "out"
libs = ["lib"]
solc_version = "0.8.24"
optimizer = true
optimizer_runs = 200
EOF
cat > drosera.toml << 'EOF'
ethereum_rpc = "https://eth-mainnet.g.alchemy.com/v2/nqOL9QkKfaj39Zi4NIUxJqAbggi3cYix"
eth_chain_id = 1

[traps.oracle_price]
path = "out/OraclePriceTrap.sol/OraclePriceTrap.json"
cooldown_period_blocks = 100
min_number_of_operators = 1
max_number_of_operators = 10
private_trap = true
whitelist = ["0xF9810b951d45D19754435D8e44b7761aA1635D72"]
constructor_args = ["0x4305FB66699C3B2702D4d05CF36551390A4c69C6","0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace","0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"]
EOF
forge build && echo "" && echo "✅ Setup complete!" && echo "Next: DROSERA_PRIVATE_KEY=0xYourKey drosera apply"
```

## Then Deploy

```bash
cd ~/oracle-price-trap
DROSERA_PRIVATE_KEY=0xYourPrivateKey drosera apply
```

## What This Creates

```
~/oracle-price-trap/
├── contracts/
│   ├── OraclePriceTrap.sol     ✅
│   ├── Trap.sol                ✅
│   └── interfaces/
│       ├── IPyth.sol           ✅
│       └── IRedStone.sol       ✅
├── out/
│   └── OraclePriceTrap.sol/
│       └── OraclePriceTrap.json ✅
├── foundry.toml                ✅
└── drosera.toml                ✅
```

## Deployment Addresses (Ethereum Mainnet)

- **Pyth Oracle**: `0x4305FB66699C3B2702D4d05CF36551390A4c69C6`
- **Chainlink ETH/USD**: `0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419`
- **ETH/USD Price ID**: `0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace`
- **Your Operator**: `0xF9810b951d45D19754435D8e44b7761aA1635D72`

## Troubleshooting

**If forge not found:**
```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
```

**If wget fails:**
Replace `wget -q` with `curl -sS` in the command.

## After Deployment

Your trap address will be automatically added to `drosera.toml`:
```toml
[traps.oracle_price]
address = "0xYourDeployedTrapAddress"
```
