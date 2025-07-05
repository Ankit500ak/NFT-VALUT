const { ethers } = require("hardhat")

async function main() {
  console.log("Seeding NFTVaultChain with sample data...")

  // Get contract addresses from deployment
  const fs = require("fs")
  let deploymentInfo

  try {
    deploymentInfo = JSON.parse(fs.readFileSync("./deployment-addresses.json", "utf8"))
  } catch (error) {
    console.error("Please run deployment first: npm run deploy")
    process.exit(1)
  }

  const [deployer, user1, user2] = await ethers.getSigners()

  // Get contract instances
  const VaultCoin = await ethers.getContractFactory("VaultCoin")
  const vaultCoin = VaultCoin.attach(deploymentInfo.vaultCoin)

  const NFTVault = await ethers.getContractFactory("NFTVault")
  const nftVault = NFTVault.attach(deploymentInfo.nftVault)

  console.log("1. Distributing VAULT tokens to test users...")

  // Give tokens to test users
  const tokenAmount = ethers.parseEther("5000") // 5000 VAULT tokens each
  await vaultCoin.mint(user1.address, tokenAmount)
  await vaultCoin.mint(user2.address, tokenAmount)

  console.log(`Minted 5000 VAULT tokens to ${user1.address}`)
  console.log(`Minted 5000 VAULT tokens to ${user2.address}`)

  console.log("\n2. Creating sample NFTs...")

  // Sample NFT data
  const sampleNFTs = [
    {
      title: "Digital Sunset",
      description: "A beautiful digital artwork capturing the essence of a perfect sunset over the mountains",
      ipfsHash: "QmSampleHash1234567890abcdef",
      royalty: 500, // 5%
      totalShares: 1000,
      sharesToList: 300,
      pricePerShare: ethers.parseEther("2.5"),
    },
    {
      title: "Cyber Punk City",
      description: "Futuristic cityscape with neon lights and flying cars in a dystopian world",
      ipfsHash: "QmSampleHash0987654321fedcba",
      royalty: 750, // 7.5%
      totalShares: 500,
      sharesToList: 150,
      pricePerShare: ethers.parseEther("5.0"),
    },
    {
      title: "Abstract Dreams",
      description: "Colorful abstract composition representing dreams and aspirations of the digital age",
      ipfsHash: "QmSampleHashabcdef1234567890",
      royalty: 300, // 3%
      totalShares: 2000,
      sharesToList: 800,
      pricePerShare: ethers.parseEther("1.0"),
    },
  ]

  // Mint NFTs with different users
  const users = [deployer, user1, user2]

  for (let i = 0; i < sampleNFTs.length; i++) {
    const nft = sampleNFTs[i]
    const creator = users[i]

    // Approve minting fee
    const mintingFee = await nftVault.mintingFee()
    await vaultCoin.connect(creator).approve(nftVault.target, mintingFee)

    // Mint NFT
    const tx = await nftVault
      .connect(creator)
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
    console.log(`✓ Minted "${nft.title}" by ${creator.address}`)
  }

  console.log("\n3. Simulating some share purchases...")

  // User1 buys shares of NFT #0 (Digital Sunset)
  const nft0SharePrice = ethers.parseEther("2.5")
  const sharesToBuy = 50
  const totalCost = nft0SharePrice * BigInt(sharesToBuy)

  await vaultCoin.connect(user1).approve(nftVault.target, totalCost)
  await nftVault.connect(user1).buyShares(0, sharesToBuy)
  console.log(`✓ User1 bought ${sharesToBuy} shares of "Digital Sunset"`)

  // User2 buys shares of NFT #1 (Cyber Punk City)
  const nft1SharePrice = ethers.parseEther("5.0")
  const sharesToBuy2 = 25
  const totalCost2 = nft1SharePrice * BigInt(sharesToBuy2)

  await vaultCoin.connect(user2).approve(nftVault.target, totalCost2)
  await nftVault.connect(user2).buyShares(1, sharesToBuy2)
  console.log(`✓ User2 bought ${sharesToBuy2} shares of "Cyber Punk City"`)

  console.log("\n=== Seeding Complete ===")
  console.log("Sample NFTs created and initial trades executed")
  console.log("\nContract Addresses:")
  console.log("VaultCoin:", deploymentInfo.vaultCoin)
  console.log("NFTVault:", deploymentInfo.nftVault)
  console.log("Marketplace:", deploymentInfo.marketplace)

  console.log("\nTest Accounts:")
  console.log("Deployer:", deployer.address)
  console.log("User1:", user1.address)
  console.log("User2:", user2.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
