import { ethers } from "ethers";
import solc from "solc";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Deploying FlashLoanTrap to Sepolia testnet...\n");

  // Sepolia configuration (using Alchemy public endpoint)
  const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/demo";
  const POOL = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  
  // Sepolia testnet tokens
  const WETH = "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c";
  const USDC = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
  const DAI = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";

  // Testing thresholds
  const WETH_THRESHOLD = ethers.parseEther("1");
  const USDC_THRESHOLD = ethers.parseUnits("1000", 6);
  const DAI_THRESHOLD = ethers.parseEther("1000");

  console.log("📋 Configuration:");
  console.log("   Network: Sepolia Testnet");
  console.log(`   Pool: ${POOL}`);
  console.log("   Monitored assets:");
  console.log(`     - WETH: ${WETH} (threshold: 1 WETH)`);
  console.log(`     - USDC: ${USDC} (threshold: 1,000 USDC)`);
  console.log(`     - DAI: ${DAI} (threshold: 1,000 DAI)`);
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

  // Connect to Sepolia
  console.log("🔗 Connecting to Sepolia...");
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const balance = await provider.getBalance(wallet.address);
  console.log(`   Deployer: ${wallet.address}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("");

  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. Get Sepolia ETH from https://sepoliafaucet.com");
    console.log("");
  }

  // Prepare constructor arguments
  const assets = [
    [WETH, WETH_THRESHOLD, "WETH"],
    [USDC, USDC_THRESHOLD, "USDC"],
    [DAI, DAI_THRESHOLD, "DAI"]
  ];

  // Deploy contract
  console.log("📤 Deploying contract...");
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract_instance = await factory.deploy(POOL, assets);
  
  console.log(`   Transaction hash: ${contract_instance.deploymentTransaction().hash}`);
  console.log("   Waiting for confirmation...");
  
  await contract_instance.waitForDeployment();
  const address = await contract_instance.getAddress();

  console.log("");
  console.log("✅ Deployment successful!");
  console.log("");
  console.log(`📍 Contract Address: ${address}`);
  console.log("");
  console.log("🔗 View on Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${address}`);
  console.log("");
  console.log("📋 Next Steps:");
  console.log("");
  console.log("1. Get test tokens from Aave faucet:");
  console.log("   https://app.aave.com (enable testnet mode, switch to Sepolia)");
  console.log("");
  console.log("2. Test flash loan detection:");
  console.log("   - Execute a flash loan > 1 WETH, 1000 USDC, or 1000 DAI");
  console.log("   - Monitor events to verify detection");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: address,
    pool: POOL,
    assets: assets,
    deployer: wallet.address,
    transactionHash: contract_instance.deploymentTransaction().hash,
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "deployment-sepolia.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-sepolia.json");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });
