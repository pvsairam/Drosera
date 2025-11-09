# Drosera Oracle Price Monitoring Trap

Real-time oracle price monitoring across Ethereum, Arbitrum, Optimism, Base, Polygon, and Solana. Detects price manipulation, stale data, flash loan attacks, and source divergence using Drosera network traps and off-chain statistical analysis.

## Features

- ⛓️ **Multi-Chain Monitoring**: Track oracle prices across 6+ blockchain networks
- 🔍 **4 Detection Types**: Mispricing, stale oracle, flash loan attacks, source divergence
- 📊 **Statistical Analysis**: Z-scores, MAD, Bollinger Bands for anomaly detection
- 🔔 **Real-Time Alerts**: Telegram notifications for incidents
- 💰 **Zero Ongoing Costs**: Off-chain detection, free oracle data from Pyth & RedStone
- 🎯 **Drosera Integration**: On-chain trap contract registered with Drosera operators

## Architecture

### Drosera Trap Contract (On-Chain)
- **File**: `contracts/OraclePriceTrap.sol`
- **Network**: Ethereum Mainnet
- **Purpose**: Defines oracle monitoring logic, runs via Drosera operators
- **Cost**: ~$50-100 one-time deployment, $0/month ongoing

### Backend Monitoring Service (Off-Chain)
- **Files**: `server/monitoring/*`
- **Stack**: Node.js + TypeScript + Express
- **Data Sources**: Pyth Network + RedStone Finance (both free)
- **Features**: Real-time 1-second price fetching, statistical detection, alert management

### Frontend Dashboard (Optional)
- **Files**: `client/*`
- **Stack**: React + TypeScript + Tailwind CSS
- **Features**: Live price grid, incident panel, configuration UI

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Private key with ETH (for deployment)
- Telegram bot token (optional, for alerts)

### Installation

```bash
# Clone repository
git clone https://github.com/pvsairam/Drosera.git
cd Drosera

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Deploy Trap Contract to Ethereum

```bash
# Deploy to Ethereum mainnet
PRIVATE_KEY=0x... tsx scripts/deploy-ethereum.ts

# Or deploy to Sepolia testnet first
PRIVATE_KEY=0x... tsx scripts/deploy-sepolia.ts
```

### Start Off-Chain Monitoring

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### Configure Telegram Alerts (Optional)

1. Create Telegram bot via @BotFather
2. Get your chat ID from @userinfobot
3. Add to `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

## Detection Types

| Type | Description | Threshold | Confirmations |
|------|-------------|-----------|---------------|
| **Mispricing** | Price deviates >15% from reference | 15% | 3 consecutive |
| **Stale Oracle** | No updates for 3x expected interval | 1 hour | Instant |
| **Flash Loan** | 20%+ price change + 5x volume spike | 15 seconds | Instant |
| **Divergence** | 20%+ std deviation across sources | 20% | Instant |

## Oracle Data Sources

### Pyth Network
- **Chains**: 104+ including Ethereum, Solana, Arbitrum, Base
- **Feeds**: 380+ price feeds
- **API**: Free unlimited HTTP API
- **Update Frequency**: 1-second polling

### RedStone Finance
- **Chains**: 110+ EVM chains
- **Feeds**: 1,300+ price feeds
- **API**: Free pull-based model
- **Update Frequency**: 1-second polling

## Deployment

### Ethereum Mainnet (Production)

```bash
# Requires ~0.05 ETH for gas
PRIVATE_KEY=0x... tsx scripts/deploy-ethereum.ts
```

**Deployed Contract Addresses**:
- Sepolia Testnet: `0x39849c938cF5142e01EF307FaF757F13A01682f6`
- Ethereum Mainnet: _Deploy your own_

### Register with Drosera

After deployment, register your trap with Drosera operators:

```bash
drosera apply --network ethereum --contract <YOUR_CONTRACT_ADDRESS>
```

## Configuration

### Environment Variables

```bash
# Required for deployment
PRIVATE_KEY=0x...

# Optional for alerts
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Optional for Twitter alerts (emergency only)
TWITTER_API_KEY=...
TWITTER_API_SECRET=...
TWITTER_ACCESS_TOKEN=...
TWITTER_ACCESS_SECRET=...
```

### Drosera Configuration (drosera.toml)

```toml
ethereum_rpc = "https://cloudflare-eth.com"
pyth_contract = "0x4305FB66699C3B2702D4d05CF36551390A4c69C6"
redstone_contract = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
eth_usd_price_id = "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace"
```

## Project Structure

```
├── contracts/              # Solidity smart contracts
│   ├── Trap.sol           # Base Drosera trap contract
│   ├── OraclePriceTrap.sol # Oracle monitoring implementation
│   └── interfaces/        # Oracle interface definitions
├── server/                # Backend Node.js server
│   ├── monitoring/        # Monitoring services
│   │   ├── MonitoringService.ts    # Main orchestrator
│   │   ├── DetectionEngine.ts      # Statistical detection
│   │   ├── PythAdapter.ts          # Pyth Network integration
│   │   ├── RedStoneAdapter.ts      # RedStone integration
│   │   └── TelegramBot.ts          # Alert delivery
│   └── routes.ts          # API endpoints
├── client/                # React frontend dashboard
│   └── src/
│       ├── pages/         # Dashboard, Config, Simulation
│       └── components/    # Reusable UI components
└── scripts/               # Deployment scripts
    ├── deploy-ethereum.ts # Mainnet deployment
    └── deploy-sepolia.ts  # Testnet deployment
```

## API Endpoints

- `GET /api/prices` - Latest multi-chain oracle prices
- `GET /api/incidents` - Recent incidents (limit: 100)
- `POST /api/incidents/:id/acknowledge` - Mark incident as resolved
- `GET /api/config/system` - System configuration
- `GET /api/config/assets` - Asset-specific thresholds
- `GET /api/status/chains` - Chain health status
- `GET /api/simulation/scenarios` - Available test scenarios
- `POST /api/simulation/run` - Execute simulation

## WebSocket Events

Connect to `/ws` for real-time updates:

- `price:update` - New oracle price data
- `incident:new` - New incident detected
- `chain:status` - Chain status change

## Development

### Run Tests

```bash
# Solidity tests
forge test

# TypeScript tests
npm test
```

### Build for Production

```bash
# Build contracts
forge build

# Build frontend & backend
npm run build
```

### Deploy Frontend

Deploy to Vercel, Netlify, or any static hosting:

```bash
npm run build
# Upload ./dist to hosting provider
```

## Costs

| Component | Deployment | Monthly |
|-----------|-----------|---------|
| Trap Contract (Ethereum) | $50-100 | $0 |
| Backend Monitoring | $0 | $0 |
| Frontend Dashboard | $0 | $0 |
| **Total** | **$50-100** | **$0** |

## Security

- ✅ Immutable contract deployment
- ✅ Zero storage dependencies (pure functions)
- ✅ Decimal normalization (prevents overflow)
- ✅ Zero price validation
- ✅ Block timestamp from collected data (no `block.timestamp`)

## Resources

- [Drosera Documentation](https://dev.drosera.io)
- [Drosera Dashboard](https://app.drosera.io)
- [Pyth Network](https://pyth.network)
- [RedStone Finance](https://redstone.finance)
- [Etherscan Contract](https://sepolia.etherscan.io/address/0x39849c938cF5142e01EF307FaF757F13A01682f6)

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [github.com/pvsairam/Drosera/issues](https://github.com/pvsairam/Drosera/issues)
- Email: Contact via GitHub profile

---

**Built for Drosera Network** - Real-time oracle monitoring with zero ongoing costs 🚀
