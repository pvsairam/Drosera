import { ethers } from "ethers";
import solc from "solc";
import fs from "fs";

async function main() {
  console.log("🚀 Deploying FlashLoanTrap to Ethereum Mainnet...\n");
  console.log("⚠️  WARNING: This will deploy to MAINNET with real ETH!");
  console.log("");

  // Ethereum Mainnet configuration (using Alchemy public endpoint)
  const RPC_URL = "https://eth-mainnet.g.alchemy.com/v2/demo";
  const POOL = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
  
  // Mainnet token addresses (Top 10 by flash loan volume)
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WBTC = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  const LINK = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  const AAVE = "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9";
  const CRV = "0xD533a949740bb3306d119CC777fa900bA034cd52";
  const UNI = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
  const MKR = "0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2";

  // Production thresholds - $50M USD equivalent
  const WETH_THRESHOLD = ethers.parseEther("25000");              // 25,000 ETH
  const USDC_THRESHOLD = ethers.parseUnits("50000000", 6);        // 50M USDC
  const USDT_THRESHOLD = ethers.parseUnits("50000000", 6);        // 50M USDT
  const DAI_THRESHOLD = ethers.parseEther("50000000");            // 50M DAI
  const WBTC_THRESHOLD = ethers.parseUnits("833", 8);             // 833 BTC
  const LINK_THRESHOLD = ethers.parseEther("2000000");            // 2M LINK
  const AAVE_THRESHOLD = ethers.parseEther("333333");             // 333,333 AAVE
  const CRV_THRESHOLD = ethers.parseEther("50000000");            // 50M CRV
  const UNI_THRESHOLD = ethers.parseEther("5000000");             // 5M UNI
  const MKR_THRESHOLD = ethers.parseEther("20000");               // 20,000 MKR

  console.log("📋 MAINNET Configuration:");
  console.log("   Network: Ethereum Mainnet");
  console.log(`   Pool: ${POOL}`);
  console.log("   Monitored assets (10 tokens covering 95%+ of volume):");
  console.log(`     - WETH: ${WETH} (threshold: 25,000 ETH = $50M)`);
  console.log(`     - USDC: ${USDC} (threshold: 50M USDC = $50M)`);
  console.log(`     - USDT: ${USDT} (threshold: 50M USDT = $50M)`);
  console.log(`     - DAI: ${DAI} (threshold: 50M DAI = $50M)`);
  console.log(`     - WBTC: ${WBTC} (threshold: 833 BTC = $50M)`);
  console.log(`     - LINK: ${LINK} (threshold: 2M LINK = $50M)`);
  console.log(`     - AAVE: ${AAVE} (threshold: 333,333 AAVE = $50M)`);
  console.log(`     - CRV: ${CRV} (threshold: 50M CRV = $50M)`);
  console.log(`     - UNI: ${UNI} (threshold: 5M UNI = $50M)`);
  console.log(`     - MKR: ${MKR} (threshold: 20,000 MKR = $50M)`);
  console.log("");

  // Check private key
  const privateKey = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ Error: PRIVATE_KEY not set");
    process.exit(1);
  }

  // Read contract sources
  console.log("📖 Reading contract sources...");
  const trapSource = fs.readFileSync("contracts/Trap.sol", "utf8");
  const flashLoanTrapSource = fs.readFileSync("contracts/FlashLoanTrap.sol", "utf8");

  // Compile contracts
  console.log("🔨 Compiling contracts...");
  const input = {
    language: "Solidity",
    sources: {
      "Trap.sol": { content: trapSource },
      "FlashLoanTrap.sol": { content: flashLoanTrapSource }
    },
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode"]
        }
      }
    }
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  // Check for errors
  if (output.errors) {
    const errors = output.errors.filter(e => e.severity === "error");
    if (errors.length > 0) {
      console.error("❌ Compilation errors:");
      errors.forEach(err => console.error(err.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts["FlashLoanTrap.sol"]["FlashLoanTrap"];
  const abi = contract.abi;
  const bytecode = contract.evm.bytecode.object;

  console.log("✅ Compilation successful!");
  console.log("");

  // Connect to Mainnet
  console.log("🔗 Connecting to Ethereum Mainnet...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  
  // Get current gas price
  const feeData = await provider.getFeeData();
  console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, "gwei")} gwei`);
  console.log("");

  // Estimate deployment cost
  const estimatedGas = 2000000n; // Conservative estimate
  const estimatedCost = estimatedGas * feeData.gasPrice;
  console.log(`💰 Estimated deployment cost: ${ethers.formatEther(estimatedCost)} ETH`);
  console.log("");

  if (balance < estimatedCost) {
    console.error("❌ Insufficient balance for deployment");
    console.error(`   Need at least: ${ethers.formatEther(estimatedCost)} ETH`);
    process.exit(1);
  }

  // Prepare constructor arguments
  const assets = [
    [WETH, WETH_THRESHOLD, "WETH"],
    [USDC, USDC_THRESHOLD, "USDC"],
    [USDT, USDT_THRESHOLD, "USDT"],
    [DAI, DAI_THRESHOLD, "DAI"],
    [WBTC, WBTC_THRESHOLD, "WBTC"],
    [LINK, LINK_THRESHOLD, "LINK"],
    [AAVE, AAVE_THRESHOLD, "AAVE"],
    [CRV, CRV_THRESHOLD, "CRV"],
    [UNI, UNI_THRESHOLD, "UNI"],
    [MKR, MKR_THRESHOLD, "MKR"]
  ];

  // Deploying to mainnet
  console.log("⚠️  DEPLOYING TO ETHEREUM MAINNET");
  console.log("   Using REAL ETH for deployment");
  console.log("");

  // Deploy contract
  console.log("📤 Deploying contract to Mainnet...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract_instance = await factory.deploy(POOL, assets, {
    gasLimit: 2500000n // Set gas limit explicitly
  });
  
  console.log(`   Transaction hash: ${contract_instance.deploymentTransaction().hash}`);
  console.log("   Waiting for confirmation...");
  
  await contract_instance.waitForDeployment();
  const address = await contract_instance.getAddress();

  console.log("");
  console.log("✅ MAINNET DEPLOYMENT SUCCESSFUL!");
  console.log("");
  console.log(`📍 Contract Address: ${address}`);
  console.log("");
  console.log("🔗 View on Etherscan:");
  console.log(`   https://etherscan.io/address/${address}`);
  console.log("");
  console.log("📋 Next Steps:");
  console.log("");
  console.log("1. Verify contract on Etherscan (recommended)");
  console.log("");
  console.log("2. Register with Drosera operators:");
  console.log("   - Submit contract address to Drosera network");
  console.log("   - Operators will monitor FlashLoan events");
  console.log("   - Zero ongoing gas costs");
  console.log("");
  console.log("3. Monitor for alerts:");
  console.log("   - Flash loans > $50M will trigger alerts");
  console.log("   - Covers 95%+ of flash loan volume");
  console.log("   - Event-based detection catches attacks in real-time");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: "mainnet",
    contractAddress: address,
    pool: POOL,
    assets: assets.map(a => ({
      token: a[0],
      threshold: a[1].toString(),
      symbol: a[2]
    })),
    deployer: wallet.address,
    transactionHash: contract_instance.deploymentTransaction().hash,
    deployedAt: new Date().toISOString(),
    status: "Production deployment with corrected uint8 event signature",
    eventSignature: "FlashLoan(address,address,address,uint256,uint8,uint256,uint16)",
    coveragePercent: 95
  };
  
  fs.writeFileSync(
    "deployment-mainnet.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-mainnet.json");
  console.log("");
  console.log("🎯 Flash Loan Trap is now protecting DeFi on Ethereum!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });
