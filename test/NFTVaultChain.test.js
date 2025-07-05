const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("NFTVaultChain", () => {
  let vaultCoin, nftVault, marketplace, fiatGateway
  let owner, user1, user2, user3
  const deployedContracts = {}

  beforeEach(async () => {
    ;[owner, user1, user2, user3] = await ethers.getSigners()

    // Deploy VaultCoin
    const VaultCoin = await ethers.getContractFactory("VaultCoin")
    vaultCoin = await VaultCoin.deploy()
    await vaultCoin.waitForDeployment()
    deployedContracts.vaultCoin = await vaultCoin.getAddress()

    // Deploy FiatGateway
    const FiatGateway = await ethers.getContractFactory("FiatGateway")
    fiatGateway = await FiatGateway.deploy(deployedContracts.vaultCoin)
    await fiatGateway.waitForDeployment()
    deployedContracts.fiatGateway = await fiatGateway.getAddress()

    // Deploy NFTVault
    const NFTVault = await ethers.getContractFactory("NFTVault")
    nftVault = await NFTVault.deploy(deployedContracts.vaultCoin)
    await nftVault.waitForDeployment()
    deployedContracts.nftVault = await nftVault.getAddress()

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace")
    marketplace = await Marketplace.deploy(deployedContracts.vaultCoin, deployedContracts.nftVault)
    await marketplace.waitForDeployment()
    deployedContracts.marketplace = await marketplace.getAddress()

    // Setup authorizations
    await vaultCoin.authorizeGateway(deployedContracts.fiatGateway, true)
    await fiatGateway.authorizeProcessor(owner.address, true)

    // Mint tokens for testing
    const mintAmount = ethers.parseEther("10000")
    await vaultCoin.mint(user1.address, mintAmount)
    await vaultCoin.mint(user2.address, mintAmount)
    await vaultCoin.mint(user3.address, mintAmount)
  })

  describe("VaultCoin", () => {
    it("Should deploy with correct initial supply", async () => {
      const totalSupply = await vaultCoin.totalSupply()
      expect(totalSupply).to.equal(ethers.parseEther("1000000"))
    })

    it("Should allow owner to mint tokens", async () => {
      const mintAmount = ethers.parseEther("1000")
      await vaultCoin.mint(user1.address, mintAmount)

      const balance = await vaultCoin.balanceOf(user1.address)
      expect(balance).to.equal(ethers.parseEther("11000"))
    })

    it("Should not allow non-owner to mint tokens", async () => {
      const mintAmount = ethers.parseEther("1000")
      await expect(vaultCoin.connect(user1).mint(user2.address, mintAmount)).to.be.revertedWithCustomError(
        vaultCoin,
        "OwnableUnauthorizedAccount",
      )
    })

    it("Should allow users to burn their tokens", async () => {
      const burnAmount = ethers.parseEther("100")
      await vaultCoin.connect(user1).burn(burnAmount)

      const balance = await vaultCoin.balanceOf(user1.address)
      expect(balance).to.equal(ethers.parseEther("9900"))
    })
  })

  describe("FiatGateway", () => {
    it("Should initiate purchase correctly", async () => {
      const usdAmount = 10000 // $100.00
      const tx = await fiatGateway.initiatePurchase(user1.address, usdAmount)
      const receipt = await tx.wait()

      const event = receipt.logs.find((log) => {
        try {
          return fiatGateway.interface.parseLog(log).name === "PurchaseInitiated"
        } catch {
          return false
        }
      })

      expect(event).to.not.be.undefined
    })

    it("Should complete purchase and mint tokens", async () => {
      const usdAmount = 10000 // $100.00
      const tx = await fiatGateway.initiatePurchase(user1.address, usdAmount)
      const receipt = await tx.wait()

      const event = receipt.logs.find((log) => {
        try {
          return fiatGateway.interface.parseLog(log).name === "PurchaseInitiated"
        } catch {
          return false
        }
      })

      const parsedEvent = fiatGateway.interface.parseLog(event)
      const transactionId = parsedEvent.args.transactionId

      const balanceBefore = await vaultCoin.balanceOf(user1.address)
      await fiatGateway.completePurchase(transactionId)
      const balanceAfter = await vaultCoin.balanceOf(user1.address)

      expect(balanceAfter).to.be.gt(balanceBefore)
    })
  })

  describe("NFTVault", () => {
    beforeEach(async () => {
      // Approve minting fee
      const mintingFee = await nftVault.mintingFee()
      await vaultCoin.connect(user1).approve(deployedContracts.nftVault, mintingFee)
    })

    it("Should mint NFT correctly", async () => {
      const tx = await nftVault.connect(user1).mintNFT(
        "QmTestHash123",
        "Test NFT",
        "A test NFT",
        500, // 5% royalty
        1000, // 1000 total shares
        300, // 300 shares to list
        ethers.parseEther("2"), // 2 VAULT per share
      )

      const receipt = await tx.wait()
      const event = receipt.logs.find((log) => {
        try {
          return nftVault.interface.parseLog(log).name === "NFTMinted"
        } catch {
          return false
        }
      })

      expect(event).to.not.be.undefined

      const tokenId = 0
      const owner = await nftVault.ownerOf(tokenId)
      expect(owner).to.equal(user1.address)
    })

    it("Should allow buying shares", async () => {
      // First mint an NFT
      await nftVault
        .connect(user1)
        .mintNFT("QmTestHash123", "Test NFT", "A test NFT", 500, 1000, 300, ethers.parseEther("2"))

      const tokenId = 0
      const sharesToBuy = 50
      const totalCost = ethers.parseEther("100") // 50 * 2 VAULT

      await vaultCoin.connect(user2).approve(deployedContracts.nftVault, totalCost)

      const tx = await nftVault.connect(user2).buyShares(tokenId, sharesToBuy)
      const receipt = await tx.wait()

      const event = receipt.logs.find((log) => {
        try {
          return nftVault.interface.parseLog(log).name === "SharesPurchased"
        } catch {
          return false
        }
      })

      expect(event).to.not.be.undefined

      const userShares = await nftVault.getShareHolderBalance(tokenId, user2.address)
      expect(userShares).to.equal(sharesToBuy)
    })

    it("Should distribute royalties correctly", async () => {
      // Mint NFT
      await nftVault.connect(user1).mintNFT(
        "QmTestHash123",
        "Test NFT",
        "A test NFT",
        500, // 5% royalty
        1000,
        300,
        ethers.parseEther("2"),
      )

      const tokenId = 0
      const sharesToBuy = 50
      const totalCost = ethers.parseEther("100")

      const creatorBalanceBefore = await vaultCoin.balanceOf(user1.address)

      await vaultCoin.connect(user2).approve(deployedContracts.nftVault, totalCost)
      await nftVault.connect(user2).buyShares(tokenId, sharesToBuy)

      const creatorBalanceAfter = await vaultCoin.balanceOf(user1.address)
      const royaltyReceived = creatorBalanceAfter - creatorBalanceBefore

      // Should receive 5% of 100 VAULT = 5 VAULT as royalty
      expect(royaltyReceived).to.equal(ethers.parseEther("5"))
    })
  })

  describe("Marketplace", () => {
    let tokenId

    beforeEach(async () => {
      // Mint an NFT first
      const mintingFee = await nftVault.mintingFee()
      await vaultCoin.connect(user1).approve(deployedContracts.nftVault, mintingFee)

      await nftVault.connect(user1).mintNFT(
        "QmTestHash123",
        "Test NFT",
        "A test NFT",
        500,
        1000,
        0, // Don't list any shares initially
        ethers.parseEther("2"),
      )

      tokenId = 0
    })

    it("Should list shares for sale", async () => {
      const sharesToList = 100
      const pricePerShare = ethers.parseEther("3")
      const duration = 7 * 24 * 60 * 60 // 7 days

      const tx = await marketplace.connect(user1).listSharesForSale(tokenId, sharesToList, pricePerShare, duration)

      const receipt = await tx.wait()
      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log).name === "SharesListedForSale"
        } catch {
          return false
        }
      })

      expect(event).to.not.be.undefined
    })

    it("Should allow buying listed shares", async () => {
      // List shares
      const sharesToList = 100
      const pricePerShare = ethers.parseEther("3")
      const duration = 7 * 24 * 60 * 60

      await marketplace.connect(user1).listSharesForSale(tokenId, sharesToList, pricePerShare, duration)

      const listingId = 0
      const totalCost = ethers.parseEther("300") // 100 * 3 VAULT

      await vaultCoin.connect(user2).approve(deployedContracts.marketplace, totalCost)

      const tx = await marketplace.connect(user2).buyListedShares(listingId)
      const receipt = await tx.wait()

      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log).name === "SharesSold"
        } catch {
          return false
        }
      })

      expect(event).to.not.be.undefined
    })

    it("Should handle offers correctly", async () => {
      const sharesToOffer = 50
      const pricePerShare = ethers.parseEther("2.5")
      const duration = 3 * 24 * 60 * 60 // 3 days
      const totalCost = ethers.parseEther("125") // 50 * 2.5 VAULT

      await vaultCoin.connect(user2).approve(deployedContracts.marketplace, totalCost)

      const tx = await marketplace.connect(user2).makeOffer(tokenId, sharesToOffer, pricePerShare, duration)

      const receipt = await tx.wait()
      const event = receipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log).name === "OfferMade"
        } catch {
          return false
        }
      })

      expect(event).to.not.be.undefined

      // Accept the offer
      const offerId = 0
      const acceptTx = await marketplace.connect(user1).acceptOffer(tokenId, offerId)
      const acceptReceipt = await acceptTx.wait()

      const acceptEvent = acceptReceipt.logs.find((log) => {
        try {
          return marketplace.interface.parseLog(log).name === "OfferAccepted"
        } catch {
          return false
        }
      })

      expect(acceptEvent).to.not.be.undefined
    })
  })

  describe("Integration Tests", () => {
    it("Should handle complete NFT lifecycle", async () => {
      // 1. User buys VAULT tokens with fiat
      const usdAmount = 50000 // $500.00
      const purchaseTx = await fiatGateway.initiatePurchase(user1.address, usdAmount)
      const purchaseReceipt = await purchaseTx.wait()

      const purchaseEvent = purchaseReceipt.logs.find((log) => {
        try {
          return fiatGateway.interface.parseLog(log).name === "PurchaseInitiated"
        } catch {
          return false
        }
      })

      const transactionId = fiatGateway.interface.parseLog(purchaseEvent).args.transactionId
      await fiatGateway.completePurchase(transactionId)

      // 2. User mints NFT
      const mintingFee = await nftVault.mintingFee()
      await vaultCoin.connect(user1).approve(deployedContracts.nftVault, mintingFee)

      await nftVault.connect(user1).mintNFT(
        "QmTestHash123",
        "Integration Test NFT",
        "A complete lifecycle test NFT",
        500, // 5% royalty
        1000, // 1000 total shares
        400, // 400 shares to list
        ethers.parseEther("1.5"), // 1.5 VAULT per share
      )

      const tokenId = 0

      // 3. Another user buys shares
      const sharesToBuy = 100
      const totalCost = ethers.parseEther("150") // 100 * 1.5 VAULT

      await vaultCoin.connect(user2).approve(deployedContracts.nftVault, totalCost)
      await nftVault.connect(user2).buyShares(tokenId, sharesToBuy)

      // 4. User lists shares on marketplace
      const sharesToList = 50
      const newPricePerShare = ethers.parseEther("2")
      const duration = 7 * 24 * 60 * 60 // 7 days

      await marketplace.connect(user2).listSharesForSale(tokenId, sharesToList, newPricePerShare, duration)

      // 5. Third user buys from marketplace
      const marketplaceCost = ethers.parseEther("100") // 50 * 2 VAULT
      await vaultCoin.connect(user3).approve(deployedContracts.marketplace, marketplaceCost)

      const listingId = 0
      await marketplace.connect(user3).buyListedShares(listingId)

      // Verify final state
      const user1Shares = await nftVault.getShareHolderBalance(tokenId, user1.address)
      const user2Shares = await nftVault.getShareHolderBalance(tokenId, user2.address)
      const user3Shares = await nftVault.getShareHolderBalance(tokenId, user3.address)

      expect(user1Shares).to.equal(600) // 1000 - 400 initially listed
      expect(user2Shares).to.equal(50) // 100 bought - 50 sold
      expect(user3Shares).to.equal(50) // 50 bought from marketplace

      console.log("✅ Complete NFT lifecycle test passed")
    })

    it("Should handle price discovery correctly", async () => {
      // Create multiple NFTs and transactions to test price discovery
      const mintingFee = await nftVault.mintingFee()

      // Mint multiple NFTs
      for (let i = 0; i < 3; i++) {
        await vaultCoin.connect(user1).approve(deployedContracts.nftVault, mintingFee)
        await nftVault.connect(user1).mintNFT(
          `QmTestHash${i}`,
          `Test NFT ${i}`,
          `Description ${i}`,
          500,
          1000,
          300,
          ethers.parseEther((i + 1).toString()), // Different prices
        )
      }

      // Buy shares at different prices
      for (let tokenId = 0; tokenId < 3; tokenId++) {
        const pricePerShare = ethers.parseEther((tokenId + 1).toString())
        const totalCost = pricePerShare * BigInt(50)

        await vaultCoin.connect(user2).approve(deployedContracts.nftVault, totalCost)
        await nftVault.connect(user2).buyShares(tokenId, 50)
      }

      // Check price history
      for (let tokenId = 0; tokenId < 3; tokenId++) {
        const priceHistory = await marketplace.getPriceHistory(tokenId)
        expect(priceHistory.length).to.be.gt(0)
      }

      console.log("✅ Price discovery test passed")
    })
  })
})
