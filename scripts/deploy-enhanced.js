const { ethers, network } = require("hardhat")

async function main() {
  console.log("🚀 Starting NFTVaultChain Enhanced Deployment...")

  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Deploy VaultCoin with enhanced features
  console.log("\n📄 Deploying VaultCoin...")
  const VaultCoin = await ethers.getContractFactory("VaultCoin")
  const vaultCoin = await VaultCoin.deploy()
  await vaultCoin.deployed()
  console.log("✅ VaultCoin deployed to:", vaultCoin.address)

  // Deploy NFTVault (assuming it exists and is compatible)
  console.log("\n🎨 Deploying NFTVault...")
  const NFTVault = await ethers.getContractFactory("NFTVault")
  const nftVault = await NFTVault.deploy(vaultCoin.address)
  await nftVault.deployed()
  console.log("✅ NFTVault deployed to:", nftVault.address)

  // Deploy AuctionSystem
  console.log("\n🔨 Deploying AuctionSystem...")
  const AuctionSystem = await ethers.getContractFactory("AuctionSystem")
  const auctionSystem = await AuctionSystem.deploy(vaultCoin.address, nftVault.address)
  await auctionSystem.deployed()
  console.log("✅ AuctionSystem deployed to:", auctionSystem.address)

  // Deploy Governance
  console.log("\n🏛️ Deploying Governance...")
  const Governance = await ethers.getContractFactory("Governance")
  const governance = await Governance.deploy(vaultCoin.address)
  await governance.deployed()
  console.log("✅ Governance deployed to:", governance.address)

  // Setup initial configurations
  console.log("\n⚙️ Setting up initial configurations...")

  // Authorize auction system to handle VaultCoin transfers
  await vaultCoin.authorizeGateway(auctionSystem.address, true)
  console.log("✅ Authorized AuctionSystem as VaultCoin gateway")

  // Register deployer as first user (gets 20 VAULT bonus)
  await vaultCoin.registerUser(deployer.address)
  console.log("✅ Registered deployer as first user with 20 VAULT bonus")

  // Create some initial test data
  console.log("\n🌱 Creating initial test data...")

  // Mint some additional VAULT tokens for testing
  await vaultCoin.mint(deployer.address, ethers.utils.parseEther("1000"))
  console.log("✅ Minted 1000 additional VAULT tokens for testing")

  // Display final deployment summary
  console.log("\n📋 DEPLOYMENT SUMMARY")
  console.log("====================")
  console.log("VaultCoin:", vaultCoin.address)
  console.log("NFTVault:", nftVault.address)
  console.log("AuctionSystem:", auctionSystem.address)
  console.log("Governance:", governance.address)
  console.log("Deployer Address:", deployer.address)

  // Display user balances
  const vaultBalance = await vaultCoin.balanceOf(deployer.address)
  const votingPower = await vaultCoin.votingPower(deployer.address)
  console.log("\n💰 DEPLOYER BALANCES")
  console.log("===================")
  console.log("VAULT Balance:", ethers.utils.formatEther(vaultBalance), "VAULT")
  console.log("Voting Power:", votingPower.toString())

  // Save deployment addresses to file
  const fs = require("fs")
  const deploymentData = {
    network: network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      VaultCoin: vaultCoin.address,
      NFTVault: nftVault.address,
      AuctionSystem: auctionSystem.address,
      Governance: governance.address,
    },
    deployer: deployer.address,
    balances: {
      vault: ethers.utils.formatEther(vaultBalance),
      votingPower: votingPower.toString(),
    },
  }

  fs.writeFileSync(`deployments/${network.name}-deployment.json`, JSON.stringify(deploymentData, null, 2))
  console.log(`\n💾 Deployment data saved to deployments/${network.name}-deployment.json`)

  console.log("\n🎉 Enhanced NFTVaultChain deployment completed successfully!")
  console.log("🔗 You can now interact with the contracts using the addresses above")
  console.log("📱 Frontend can connect to these contracts for full functionality")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error)
    process.exit(1)
  })
