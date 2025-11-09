/**
 * Deploy OraclePriceTrap to Ethereum Mainnet
 * 
 * Ethereum mainnet is required for Drosera Trap integration.
 * Estimated deployment cost: $50-100 (depending on gas prices)
 * 
 * Usage:
 *   PRIVATE_KEY=0x... tsx scripts/deploy-ethereum.ts
 */

import { ethers } from 'ethers';
import solc from 'solc';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ethereum Mainnet Configuration
const ETH_MAINNET_RPCS = [
  'https://eth.llamarpc.com',
  'https://ethereum.publicnode.com',
  'https://cloudflare-eth.com'
];
const ETH_RPC = ETH_MAINNET_RPCS[0];
const CHAIN_ID = 1;

// Oracle addresses on Ethereum Mainnet
const PYTH_CONTRACT = '0x4305FB66699C3B2702D4d05CF36551390A4c69C6'; // Pyth on Ethereum
const ETH_USD_PRICE_ID = '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace'; // ETH/USD
const REDSTONE_CONTRACT = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'; // Chainlink ETH/USD on Ethereum

async function main() {
  console.log('🚀 Deploying OraclePriceTrap to Ethereum Mainnet...\n');
  console.log('⚠️  WARNING: This will cost real ETH (~$50-100)');
  console.log('    Make sure you have sufficient balance!\n');

  // Check for private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('❌ Error: PRIVATE_KEY environment variable not set');
    console.log('\nSet it with:');
    console.log('  export PRIVATE_KEY=0x...');
    process.exit(1);
  }

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(ETH_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Verify network
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(CHAIN_ID)) {
    console.error(`❌ Wrong network! Expected Ethereum (${CHAIN_ID}), got ${network.chainId}`);
    process.exit(1);
  }

  console.log('📝 Deployment Configuration:');
  console.log('  Network: Ethereum Mainnet');
  console.log('  Chain ID:', CHAIN_ID);
  console.log('  Deployer:', wallet.address);
  console.log('  Pyth Contract:', PYTH_CONTRACT);
  console.log('  RedStone/Chainlink:', REDSTONE_CONTRACT);
  console.log('  ETH/USD Price ID:', ETH_USD_PRICE_ID);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('  Balance:', ethers.formatEther(balance), 'ETH\n');

  if (balance === 0n) {
    console.error('❌ Error: Deployer has no ETH');
    console.log('\nYou need at least 0.05 ETH for deployment');
    process.exit(1);
  }

  const minBalance = ethers.parseEther('0.05');
  if (balance < minBalance) {
    console.error('❌ Insufficient balance for mainnet deployment');
    console.log(`   Current: ${ethers.formatEther(balance)} ETH`);
    console.log(`   Required: ~0.05 ETH minimum`);
    process.exit(1);
  }

  // Compile contract
  console.log('📄 Compiling contract...');
  
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

  console.log('⚙️  Compiling with solc...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

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

  // Estimate gas
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const deployTx = await factory.getDeployTransaction(
    PYTH_CONTRACT,
    ETH_USD_PRICE_ID,
    REDSTONE_CONTRACT
  );

  const gasEstimate = await provider.estimateGas(deployTx);
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || 0n;
  const estimatedCost = gasEstimate * gasPrice;

  console.log('💰 Estimated Deployment Cost:');
  console.log('  Gas estimate:', gasEstimate.toString());
  console.log('  Gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei');
  console.log('  Total cost: ~', ethers.formatEther(estimatedCost), 'ETH');
  console.log('  USD cost: ~$', (Number(ethers.formatEther(estimatedCost)) * 3000).toFixed(2), '(assuming ETH = $3000)\n');

  // Final confirmation
  console.log('⚠️  FINAL CONFIRMATION:');
  console.log(`   You are about to deploy to ETHEREUM MAINNET`);
  console.log(`   This will cost approximately ${ethers.formatEther(estimatedCost)} ETH`);
  console.log(`   Proceeding in 5 seconds... Press Ctrl+C to cancel\n`);
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deploy contract
  console.log('🚀 Deploying OraclePriceTrap to Ethereum Mainnet...');
  const oracleTrap = await factory.deploy(
    PYTH_CONTRACT,
    ETH_USD_PRICE_ID,
    REDSTONE_CONTRACT
  );

  console.log('⏳ Waiting for deployment transaction...');
  await oracleTrap.waitForDeployment();
  
  const address = await oracleTrap.getAddress();
  const txHash = oracleTrap.deploymentTransaction()?.hash;

  console.log('\n✅ OraclePriceTrap deployed to Ethereum Mainnet!');
  console.log('═══════════════════════════════════════════════\n');
  console.log('📍 Contract Address:', address);
  console.log('📝 Transaction Hash:', txHash);
  console.log('⛓️  Network: Ethereum Mainnet (Chain ID: 1)\n');

  // Calculate actual cost
  const finalBalance = await provider.getBalance(wallet.address);
  const actualCost = balance - finalBalance;
  
  console.log('💸 Actual Deployment Cost:');
  console.log('  ETH spent:', ethers.formatEther(actualCost));
  console.log('  USD cost: ~$', (Number(ethers.formatEther(actualCost)) * 3000).toFixed(2), '(assuming ETH = $3000)\n');

  // Save deployment info
  const deploymentInfo = {
    network: 'ethereum-mainnet',
    chainId: CHAIN_ID,
    contract: 'OraclePriceTrap',
    address: address,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    txHash: txHash,
    constructor: {
      pythContract: PYTH_CONTRACT,
      pythPriceId: ETH_USD_PRICE_ID,
      redstoneContract: REDSTONE_CONTRACT
    },
    cost: {
      eth: ethers.formatEther(actualCost),
      gasUsed: gasEstimate.toString()
    }
  };

  console.log('📋 Deployment Summary:');
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log();

  // Next steps
  console.log('🎯 Next Steps:');
  console.log('═══════════════════════════════════════════════\n');
  console.log('1. View on Etherscan:');
  console.log(`   https://etherscan.io/address/${address}\n`);
  console.log('2. Register with Drosera:');
  console.log(`   drosera apply --network ethereum --contract ${address}\n`);
  console.log('3. Update your .env file:');
  console.log(`   GUARDIAN_CONTRACT_ADDRESS=${address}`);
  console.log(`   GUARDIAN_NETWORK=ethereum\n`);
  console.log('4. Start off-chain monitoring:');
  console.log('   npm run dev\n');

  console.log('🎉 Deployment complete!');
  console.log('Your Drosera Oracle Trap is now live on Ethereum Mainnet! 🚀');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
