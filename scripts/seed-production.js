const { ethers } = require("hardhat")
const IPFSService = require("./ipfs-utils")
const fs = require("fs")

async function main() {
  console.log("🌱 Seeding NFTVaultChain with production data...")

  // Load deployment addresses
  const networkName = require("hardhat").network.name
  const deploymentFile = `deployment-${networkName}.json`

  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file ${deploymentFile} not found. Please deploy contracts first.`)
    process.exit(1)
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"))
  const contracts = deployment.contracts

  // Get signers
  const [deployer, artist1, artist2, collector1, collector2] = await ethers.getSigners()

  // Get contract instances
  const VaultCoin = await ethers.getContractFactory("VaultCoin")
  const vaultCoin = VaultCoin.attach(contracts.vaultCoin)

  const NFTVault = await ethers.getContractFactory("NFTVault")
  const nftVault = NFTVault.attach(contracts.nftVault)

  const FiatGateway = await ethers.getContractFactory("FiatGateway")
  const fiatGateway = FiatGateway.attach(contracts.fiatGateway)

  const Marketplace = await ethers.getContractFactory("Marketplace")
  const marketplace = Marketplace.attach(contracts.marketplace)

  console.log("📋 Contract addresses loaded:")
  console.log("VaultCoin:", contracts.vaultCoin)
  console.log("NFTVault:", contracts.nftVault)
  console.log("FiatGateway:", contracts.fiatGateway)
  console.log("Marketplace:", contracts.marketplace)

  // Initialize IPFS service (if keys are provided)
  let ipfsService = null
  if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY) {
    ipfsService = new IPFSService(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY)
    console.log("🔗 IPFS service initialized")
  } else {
    console.log("⚠️ IPFS keys not found, using placeholder hashes")
  }

  // 1. Distribute VAULT tokens
  console.log("\n💰 Distributing VAULT tokens...")
  const tokenAmount = ethers.parseEther("25000") // 25,000 VAULT tokens each

  const recipients = [artist1, artist2, collector1, collector2]
  for (const recipient of recipients) {
    try {
      await vaultCoin.mint(recipient.address, tokenAmount)
      console.log(`✅ Minted 25,000 VAULT to ${recipient.address}`)
    } catch (error) {
      console.log(`⚠️ Failed to mint to ${recipient.address}:`, error.message)
    }
  }

  // 2. Simulate fiat purchases
  console.log("\n💳 Simulating fiat purchases...")
  const fiatPurchases = [
    { user: collector1, amount: 100000 }, // $1,000
    { user: collector2, amount: 50000 }, // $500
  ]

  for (const purchase of fiatPurchases) {
    try {
      const tx = await fiatGateway.initiatePurchase(purchase.user.address, purchase.amount)
      const receipt = await tx.wait()

      const event = receipt.logs.find((log) => {
        try {
          return fiatGateway.interface.parseLog(log).name === "PurchaseInitiated"
        } catch {
          return false
        }
      })

      if (event) {
        const parsedEvent = fiatGateway.interface.parseLog(event)
        const transactionId = parsedEvent.args.transactionId

        await fiatGateway.completePurchase(transactionId)
        console.log(`✅ Completed fiat purchase for ${purchase.user.address}: $${purchase.amount / 100}`)
      }
    } catch (error) {
      console.log(`⚠️ Fiat purchase failed for ${purchase.user.address}:`, error.message)
    }
  }

  // 3. Create sample NFTs
  console.log("\n🎨 Creating sample NFTs...")

  const sampleNFTs = [
    {
      creator: artist1,
      title: "Digital Renaissance",
      description:
        "A modern interpretation of classical art techniques applied to digital medium. This piece explores the intersection of traditional artistic values and contemporary digital expression.",
      royalty: 750, // 7.5%
      totalShares: 2000,
      sharesToList: 800,
      pricePerShare: ethers.parseEther("3.5"),
      ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG", // Placeholder
    },
    {
      creator: artist1,
      title: "Neon Dreams",
      description:
        "Cyberpunk-inspired artwork featuring vibrant neon colors and futuristic cityscapes. A vision of tomorrow through the lens of digital artistry.",
      royalty: 500, // 5%
      totalShares: 1500,
      sharesToList: 600,
      pricePerShare: ethers.parseEther("2.8"),
      ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH", // Placeholder
    },
    {
      creator: artist2,
      title: "Abstract Emotions",
      description:
        "An exploration of human emotions through abstract forms and colors. Each element represents a different aspect of the human experience.",
      royalty: 600, // 6%
      totalShares: 1000,
      sharesToList: 400,
      pricePerShare: ethers.parseEther("4.2"),
      ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdI", // Placeholder
    },
    {
      creator: artist2,
      title: "Geometric Harmony",
      description:
        "Perfect mathematical precision meets artistic expression in this geometric masterpiece. A study in balance, proportion, and visual rhythm.",
      royalty: 400, // 4%
      totalShares: 3000,
      sharesToList: 1200,
      pricePerShare: ethers.parseEther("1.9"),
      ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdJ", // Placeholder
    },
    {
      creator: deployer,
      title: "Genesis Collection #1",
      description:
        "The first NFT in the NFTVaultChain Genesis Collection. A historic piece marking the beginning of decentralized fractional NFT ownership.",
      royalty: 1000, // 10%
      totalShares: 5000,
      sharesToList: 2000,
      pricePerShare: ethers.parseEther("2.5"),
      ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdK", // Placeholder
    },
  ]

  const mintingFee = await nftVault.mintingFee()
  let tokenIdCounter = 0

  for (const nft of sampleNFTs) {
    try {
      // Approve minting fee
      await vaultCoin.connect(nft.creator).approve(contracts.nftVault, mintingFee)

      // Mint NFT
      const tx = await nftVault
        .connect(nft.creator)
        .mintNFT(
          nft.ipfsHash,
          nft.title,
          nft.description,
          nft.royalty,
          nft.totalShares,
          nft.sharesToList,
          nft.pricePerShare,
        )

      await tx.wait()
      console.log(`✅ Minted "${nft.title}" by ${nft.creator.address} (Token ID: ${tokenIdCounter})`)
      tokenIdCounter++
    } catch (error) {
      console.log(`⚠️ Failed to mint "${nft.title}":`, error.message)
    }
  }

  // 4. Simulate trading activity
  console.log("\n📈 Simulating trading activity...")

  const trades = [
    { tokenId: 0, buyer: collector1, shares: 100 },
    { tokenId: 0, buyer: collector2, shares: 75 },
    { tokenId: 1, buyer: collector1, shares: 150 },
    { tokenId: 2, buyer: collector2, shares: 80 },
    { tokenId: 3, buyer: collector1, shares: 200 },
    { tokenId: 4, buyer: collector2, shares: 300 },
  ]

  for (const trade of trades) {
    try {
      // Get NFT details to calculate cost
      const nftDetails = await nftVault.getNFTDetails(trade.tokenId)
      const totalCost = nftDetails.pricePerShare * BigInt(trade.shares)

      // Approve and buy shares
      await vaultCoin.connect(trade.buyer).approve(contracts.nftVault, totalCost)
      await nftVault.connect(trade.buyer).buyShares(trade.tokenId, trade.shares)

      console.log(`✅ ${trade.buyer.address} bought ${trade.shares} shares of Token ID ${trade.tokenId}`)
    } catch (error) {
      console.log(`⚠️ Trade failed for Token ID ${trade.tokenId}:`, error.message)
    }
  }

  // 5. Create marketplace listings
  console.log("\n🏪 Creating marketplace listings...")

  const listings = [
    { tokenId: 0, seller: collector1, shares: 50, price: ethers.parseEther("4.0"), duration: 14 * 24 * 60 * 60 },
    { tokenId: 1, seller: collector1, shares: 75, price: ethers.parseEther("3.2"), duration: 7 * 24 * 60 * 60 },
    { tokenId: 2, seller: collector2, shares: 40, price: ethers.parseEther("4.8"), duration: 10 * 24 * 60 * 60 },
  ]

  for (const listing of listings) {
    try {
      await marketplace
        .connect(listing.seller)
        .listSharesForSale(listing.tokenId, listing.shares, listing.price, listing.duration)

      console.log(
        `✅ Listed ${listing.shares} shares of Token ID ${listing.tokenId} at ${ethers.formatEther(listing.price)} VAULT each`,
      )
    } catch (error) {
      console.log(`⚠️ Listing failed for Token ID ${listing.tokenId}:`, error.message)
    }
  }

  // 6. Create some offers
  console.log("\n💼 Creating offers...")

  const offers = [
    { tokenId: 3, buyer: collector1, shares: 100, price: ethers.parseEther("2.1"), duration: 5 * 24 * 60 * 60 },
    { tokenId: 4, buyer: collector2, shares: 150, price: ethers.parseEther("2.8"), duration: 3 * 24 * 60 * 60 },
  ]

  for (const offer of offers) {
    try {
      const totalCost = offer.price * BigInt(offer.shares)
      await vaultCoin.connect(offer.buyer).approve(contracts.marketplace, totalCost)

      await marketplace.connect(offer.buyer).makeOffer(offer.tokenId, offer.shares, offer.price, offer.duration)

      console.log(
        `✅ Made offer for ${offer.shares} shares of Token ID ${offer.tokenId} at ${ethers.formatEther(offer.price)} VAULT each`,
      )
    } catch (error) {
      console.log(`⚠️ Offer failed for Token ID ${offer.tokenId}:`, error.message)
    }
  }

  // 7. Generate summary report
  console.log("\n📊 === Seeding Summary ===")

  const totalSupply = await nftVault.totalSupply()
  console.log(`Total NFTs minted: ${totalSupply}`)

  const activeListings = await marketplace.getActiveListings()
  console.log(`Active marketplace listings: ${activeListings.length}`)

  // Check balances
  console.log("\n💰 VAULT Token Balances:")
  const accounts = [
    { name: "Deployer", address: deployer.address },
    { name: "Artist 1", address: artist1.address },
    { name: "Artist 2", address: artist2.address },
    { name: "Collector 1", address: collector1.address },
    { name: "Collector 2", address: collector2.address },
  ]

  for (const account of accounts) {
    const balance = await vaultCoin.balanceOf(account.address)
    console.log(`${account.name}: ${ethers.formatEther(balance)} VAULT`)
  }

  // Save seeding report
  const seedingReport = {
    network: networkName,
    timestamp: new Date().toISOString(),
    totalNFTs: totalSupply.toString(),
    activeListings: activeListings.length,
    accounts: accounts.map((acc) => ({
      name: acc.name,
      address: acc.address,
    })),
    contracts: contracts,
  }

  fs.writeFileSync(`seeding-report-${networkName}.json`, JSON.stringify(seedingReport, null, 2))
  console.log(`\n📄 Seeding report saved to seeding-report-${networkName}.json`)

  console.log("\n🎉 Seeding completed successfully!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
