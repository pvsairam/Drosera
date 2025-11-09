import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  console.log("🚀 Deploying FlashLoanTrap to Sepolia testnet...\n");

  // Sepolia Aave V3 configuration
  const POOL = "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951";
  
  // Sepolia testnet tokens
  const WETH = "0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c";
  const USDC = "0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8";
  const DAI = "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357";

  // Testing thresholds (low for easy testing)
  const WETH_THRESHOLD = ethers.parseEther("1");              // 1 WETH
  const USDC_THRESHOLD = ethers.parseUnits("1000", 6);        // 1,000 USDC
  const DAI_THRESHOLD = ethers.parseEther("1000");            // 1,000 DAI

  console.log("📋 Configuration:");
  console.log("   Network: Sepolia Testnet");
  console.log(`   Pool: ${POOL}`);
  console.log("   Monitored assets:");
  console.log(`     - WETH: ${WETH} (threshold: 1 WETH)`);
  console.log(`     - USDC: ${USDC} (threshold: 1,000 USDC)`);
  console.log(`     - DAI: ${DAI} (threshold: 1,000 DAI)`);
  console.log("");

  // Asset configurations
  const assets = [
    { token: WETH, threshold: WETH_THRESHOLD, symbol: "WETH" },
    { token: USDC, threshold: USDC_THRESHOLD, symbol: "USDC" },
    { token: DAI, threshold: DAI_THRESHOLD, symbol: "DAI" }
  ];

  console.log("🔨 Compiling contracts...");
  const FlashLoanTrap = await ethers.getContractFactory("FlashLoanTrap");

  console.log("📤 Deploying contract...");
  const trap = await FlashLoanTrap.deploy(POOL, assets);
  
  await trap.waitForDeployment();
  const address = await trap.getAddress();

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
  console.log("3. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${address} \\`);
  console.log(`     "${POOL}" \\`);
  console.log(`     '[${JSON.stringify(assets)}]'`);
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: address,
    pool: POOL,
    assets: assets,
    deployedAt: new Date().toISOString()
  };
  
  const fs = await import('fs');
  fs.writeFileSync(
    'deployment-sepolia.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-sepolia.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed!");
    console.error(error);
    process.exit(1);
  });
