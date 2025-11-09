/**
 * Deploy OraclePriceTrap to Sepolia testnet
 * 
 * Usage:
 *   PRIVATE_KEY=0x... ETHERSCAN_API_KEY=... tsx scripts/deploy-sepolia.ts
 * 
 * Required environment variables:
 *   - PRIVATE_KEY: Deployer private key (with Sepolia ETH)
 *   - ETHERSCAN_API_KEY: For contract verification (optional)
 */

import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sepolia testnet configuration - try multiple RPCs for reliability
const SEPOLIA_RPCS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://1rpc.io/sepolia',
  'https://rpc2.sepolia.org',
  'https://rpc.sepolia.org'
];
const SEPOLIA_RPC = SEPOLIA_RPCS[0]; // Use most reliable one

// Oracle addresses on Sepolia
const PYTH_CONTRACT = '0xDd24F84d36BF92C65F92307595335bdFab5Bbd21'; // Pyth Sepolia
const ETH_USD_PRICE_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'; // ETH/USD

// For this demo, we'll use Chainlink's ETH/USD feed (compatible with RedStone interface)
const REDSTONE_CONTRACT = '0x694AA1769357215DE4FAC081bf1f309aDC325306'; // Chainlink ETH/USD on Sepolia

async function main() {
  console.log('🚀 Deploying OraclePriceTrap to Sepolia...\n');

  // Check for private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY environment variable not set');
    console.log('\nSet it with:');
    console.log('  export PRIVATE_KEY=0x...');
    process.exit(1);
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log('📝 Deployment Configuration:');
  console.log('  Network: Sepolia');
  console.log('  Deployer:', wallet.address);
  console.log('  Pyth Contract:', PYTH_CONTRACT);
  console.log('  RedStone Contract:', REDSTONE_CONTRACT);
  console.log('  ETH/USD Price ID:', ETH_USD_PRICE_ID);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('  Balance:', ethers.formatEther(balance), 'ETH\n');

  if (balance === 0n) {
    console.error('❌ Error: Deployer has no Sepolia ETH');
    console.log('\nGet Sepolia ETH from:');
    console.log('  - https://sepoliafaucet.com/');
    console.log('  - https://www.alchemy.com/faucets/ethereum-sepolia');
    process.exit(1);
  }

  // Read and compile contract
  console.log('📄 Reading contract bytecode...');
  
  // For Replit: We'll use solc-js to compile on the fly
  const solc = await import('solc');
  
  const trapSource = readFileSync(join(__dirname, '../contracts/Trap.sol'), 'utf8');
  const oracleTrapSource = readFileSync(join(__dirname, '../contracts/OraclePriceTrap.sol'), 'utf8');
  const ipythSource = readFileSync(join(__dirname, '../contracts/interfaces/IPyth.sol'), 'utf8');
  const iredstoneSource = readFileSync(join(__dirname, '../contracts/interfaces/IRedStone.sol'), 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'Trap.sol': { content: trapSource },
      'OraclePriceTrap.sol': { content: oracleTrapSource },
      'interfaces/IPyth.sol': { content: ipythSource },
      'interfaces/IRedStone.sol': { content: iredstoneSource }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode']
        }
      }
    }
  };

  console.log('⚙️  Compiling contracts...');
  const output = JSON.parse(solc.default.compile(JSON.stringify(input)));

  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === 'error');
    if (errors.length > 0) {
      console.error('❌ Compilation errors:');
      errors.forEach((e: any) => console.error('  ', e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts['OraclePriceTrap.sol']['OraclePriceTrap'];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log('✅ Contract compiled successfully\n');

  // Deploy contract
  console.log('🚀 Deploying OraclePriceTrap...');
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  
  const oracleTrap = await factory.deploy(
    PYTH_CONTRACT,
    ETH_USD_PRICE_ID,
    REDSTONE_CONTRACT
  );

  console.log('⏳ Waiting for deployment...');
  await oracleTrap.waitForDeployment();
  
  const address = await oracleTrap.getAddress();
  console.log('\n✅ OraclePriceTrap deployed!');
  console.log('   Address:', address);
  console.log('   Transaction:', oracleTrap.deploymentTransaction()?.hash);

  // Save deployment info
  const deploymentInfo = {
    network: 'sepolia',
    contract: 'OraclePriceTrap',
    address: address,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    constructor: {
      pythContract: PYTH_CONTRACT,
      pythPriceId: ETH_USD_PRICE_ID,
      redstoneContract: REDSTONE_CONTRACT
    }
  };

  console.log('\n📋 Deployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Verify on Etherscan (if API key provided)
  const etherscanKey = process.env.ETHERSCAN_API_KEY;
  if (etherscanKey) {
    console.log('\n🔍 Verifying on Etherscan...');
    console.log('   (This may take a few minutes)');
    console.log('\n   Manual verification command:');
    console.log(`   forge verify-contract ${address} OraclePriceTrap --chain sepolia --constructor-args $(cast abi-encode "constructor(address,bytes32,address)" ${PYTH_CONTRACT} ${ETH_USD_PRICE_ID} ${REDSTONE_CONTRACT})`);
  }

  console.log('\n🎉 Deployment complete!');
  console.log('\n📍 View on Sepolia Etherscan:');
  console.log(`   https://sepolia.etherscan.io/address/${address}`);
  console.log('\n🔗 Next steps:');
  console.log('   1. Verify contract on Etherscan (if not done automatically)');
  console.log('   2. Test collect() function');
  console.log('   3. Deploy to Drosera with: drosera apply --network sepolia');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
