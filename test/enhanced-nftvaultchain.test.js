const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("Enhanced NFTVaultChain", () => {
  let vaultCoin, nftVault, auctionSystem, governance
  let owner, user1, user2, user3
  const tokenId = 1

  beforeEach(async () => {
    ;[owner, user1, user2, user3] = await ethers.getSigners()

    // Deploy VaultCoin
    const VaultCoin = await ethers.getContractFactory("VaultCoin")
    vaultCoin = await VaultCoin.deploy()
    await vaultCoin.deployed()

    // Deploy NFTVault (mock for testing)
    const NFTVault = await ethers.getContractFactory("NFTVault")
    nftVault = await NFTVault.deploy(vaultCoin.address)
    await nftVault.deployed()

    // Deploy AuctionSystem
    const AuctionSystem = await ethers.getContractFactory("AuctionSystem")
    auctionSystem = await AuctionSystem.deploy(vaultCoin.address, nftVault.address)
    await auctionSystem.deployed()

    // Deploy Governance
    const Governance = await ethers.getContractFactory("Governance")
    governance = await Governance.deploy(vaultCoin.address)
    await governance.deployed()

    // Setup authorizations
    await vaultCoin.authorizeGateway(auctionSystem.address, true)
  })

  describe("VaultCoin Enhanced Features", () => {
    it("Should register new users and give 20 VAULT bonus", async () => {
      // Register user1
      await vaultCoin.registerUser(user1.address)

      const balance = await vaultCoin.balanceOf(user1.address)
      expect(balance).to.equal(ethers.utils.parseEther("20"))

      const hasReceived = await vaultCoin.hasReceivedBonus(user1.address)
      expect(hasReceived).to.be.true
    })

    it("Should not allow double registration", async () => {
      await vaultCoin.registerUser(user1.address)

      await expect(vaultCoin.registerUser(user1.address)).to.be.revertedWith("User already registered")
    })

    it("Should calculate voting power correctly", async () => {
      await vaultCoin.registerUser(user1.address)

      // 20 VAULT tokens should give sqrt(20) ≈ 4 voting power
      const votingPower = await vaultCoin.votingPower(user1.address)
      expect(votingPower).to.equal(4) // sqrt(20) = 4.47, floored to 4
    })

    it("Should update voting power on transfers", async () => {
      await vaultCoin.registerUser(user1.address)
      await vaultCoin.registerUser(user2.address)

      const initialPower1 = await vaultCoin.votingPower(user1.address)
      const initialPower2 = await vaultCoin.votingPower(user2.address)

      // Transfer 10 VAULT from user1 to user2
      await vaultCoin.connect(user1).transfer(user2.address, ethers.utils.parseEther("10"))

      const newPower1 = await vaultCoin.votingPower(user1.address)
      const newPower2 = await vaultCoin.votingPower(user2.address)

      expect(newPower1).to.be.lt(initialPower1)
      expect(newPower2).to.be.gt(initialPower2)
    })
  })

  describe("Auction System", () => {
    beforeEach(async () => {
      // Register users and give them VAULT tokens
      await vaultCoin.registerUser(user1.address)
      await vaultCoin.registerUser(user2.address)
      await vaultCoin.mint(user1.address, ethers.utils.parseEther("100"))
      await vaultCoin.mint(user2.address, ethers.utils.parseEther("100"))
    })

    it("Should create an auction", async () => {
      const shares = 50
      const startingBid = ethers.utils.parseEther("1")
      const duration = 24 * 60 * 60 // 24 hours

      await expect(auctionSystem.connect(user1).createAuction(tokenId, shares, startingBid, duration)).to.emit(
        auctionSystem,
        "AuctionCreated",
      )

      const auction = await auctionSystem.auctions(0)
      expect(auction.seller).to.equal(user1.address)
      expect(auction.shares).to.equal(shares)
      expect(auction.startingBid).to.equal(startingBid)
      expect(auction.active).to.be.true
    })

    it("Should place bids on auction", async () => {
      const shares = 50
      const startingBid = ethers.utils.parseEther("1")
      const duration = 24 * 60 * 60

      await auctionSystem.connect(user1).createAuction(tokenId, shares, startingBid, duration)

      const bidAmount = ethers.utils.parseEther("2")
      await vaultCoin.connect(user2).approve(auctionSystem.address, bidAmount)

      await expect(auctionSystem.connect(user2).placeBid(0, bidAmount)).to.emit(auctionSystem, "BidPlaced")

      const auction = await auctionSystem.auctions(0)
      expect(auction.currentBid).to.equal(bidAmount)
      expect(auction.currentBidder).to.equal(user2.address)
    })

    it("Should not allow seller to bid on own auction", async () => {
      const shares = 50
      const startingBid = ethers.utils.parseEther("1")
      const duration = 24 * 60 * 60

      await auctionSystem.connect(user1).createAuction(tokenId, shares, startingBid, duration)

      const bidAmount = ethers.utils.parseEther("2")
      await vaultCoin.connect(user1).approve(auctionSystem.address, bidAmount)

      await expect(auctionSystem.connect(user1).placeBid(0, bidAmount)).to.be.revertedWith("Seller cannot bid")
    })

    it("Should refund previous bidder when outbid", async () => {
      const shares = 50
      const startingBid = ethers.utils.parseEther("1")
      const duration = 24 * 60 * 60

      await auctionSystem.connect(user1).createAuction(tokenId, shares, startingBid, duration)

      // First bid from user2
      const firstBid = ethers.utils.parseEther("2")
      await vaultCoin.connect(user2).approve(auctionSystem.address, firstBid)
      await auctionSystem.connect(user2).placeBid(0, firstBid)

      const balanceAfterFirstBid = await vaultCoin.balanceOf(user2.address)

      // Second bid from user3
      const secondBid = ethers.utils.parseEther("3")
      await vaultCoin.connect(user3).approve(auctionSystem.address, secondBid)
      await auctionSystem.connect(user3).placeBid(0, secondBid)

      // user2 should be refunded
      const balanceAfterRefund = await vaultCoin.balanceOf(user2.address)
      expect(balanceAfterRefund).to.equal(balanceAfterFirstBid.add(firstBid))
    })
  })

  describe("Governance System", () => {
    beforeEach(async () => {
      // Register users and give them enough VAULT for proposals
      await vaultCoin.registerUser(user1.address)
      await vaultCoin.mint(user1.address, ethers.utils.parseEther("1000")) // Enough for proposal threshold
      await vaultCoin.registerUser(user2.address)
      await vaultCoin.mint(user2.address, ethers.utils.parseEther("500"))
    })

    it("Should create a proposal with sufficient voting power", async () => {
      const title = "Test Proposal"
      const description = "This is a test proposal"
      const proposalType = 0 // ChangeMintingFee
      const proposalData = "0x"

      await expect(governance.connect(user1).createProposal(title, description, proposalType, proposalData)).to.emit(
        governance,
        "ProposalCreated",
      )

      const proposal = await governance.proposals(0)
      expect(proposal.proposer).to.equal(user1.address)
      expect(proposal.title).to.equal(title)
    })

    it("Should not allow proposal creation with insufficient voting power", async () => {
      const title = "Test Proposal"
      const description = "This is a test proposal"
      const proposalType = 0
      const proposalData = "0x"

      await expect(
        governance.connect(user2).createProposal(title, description, proposalType, proposalData),
      ).to.be.revertedWith("Insufficient voting power")
    })

    it("Should allow voting on active proposals", async () => {
      // Create proposal
      await governance.connect(user1).createProposal("Test", "Description", 0, "0x")

      // Vote on proposal
      await expect(
        governance
          .connect(user2)
          .vote(0, 1), // Vote "For"
      ).to.emit(governance, "VoteCast")

      const vote = await governance.votes(0, user2.address)
      expect(vote.hasVoted).to.be.true
      expect(vote.vote).to.equal(1)
    })

    it("Should not allow double voting", async () => {
      await governance.connect(user1).createProposal("Test", "Description", 0, "0x")

      await governance.connect(user2).vote(0, 1)

      await expect(governance.connect(user2).vote(0, 0)).to.be.revertedWith("Already voted")
    })

    it("Should calculate proposal state correctly", async () => {
      await governance.connect(user1).createProposal("Test", "Description", 0, "0x")

      // Should be active initially
      const initialState = await governance.getProposalState(0)
      expect(initialState).to.equal(1) // Active
    })
  })

  describe("Integration Tests", () => {
    it("Should handle complete user journey", async () => {
      // 1. Register new user
      await vaultCoin.registerUser(user1.address)
      let balance = await vaultCoin.balanceOf(user1.address)
      expect(balance).to.equal(ethers.utils.parseEther("20"))

      // 2. Mint additional tokens
      await vaultCoin.mint(user1.address, ethers.utils.parseEther("100"))
      balance = await vaultCoin.balanceOf(user1.address)
      expect(balance).to.equal(ethers.utils.parseEther("120"))

      // 3. Check voting power
      const votingPower = await vaultCoin.votingPower(user1.address)
      expect(votingPower).to.be.gt(0)

      // 4. Create governance proposal
      await governance.connect(user1).createProposal("Test Proposal", "Description", 0, "0x")

      // 5. Vote on proposal
      await governance.connect(user1).vote(0, 1)

      // 6. Create auction
      await auctionSystem.connect(user1).createAuction(1, 50, ethers.utils.parseEther("1"), 24 * 60 * 60)

      const auction = await auctionSystem.auctions(0)
      expect(auction.active).to.be.true
    })

    it("Should maintain consistency across all contracts", async () => {
      // Register multiple users
      await vaultCoin.registerUser(user1.address)
      await vaultCoin.registerUser(user2.address)
      await vaultCoin.registerUser(user3.address)

      // Check total supply increased correctly
      const totalSupply = await vaultCoin.totalSupply()
      const expectedSupply = ethers.utils.parseEther("1000060") // Initial + 3 * 20 bonus
      expect(totalSupply).to.equal(expectedSupply)

      // Check total voting power
      const totalVotingPower = await vaultCoin.totalVotingPower()
      expect(totalVotingPower).to.be.gt(0)

      // Verify all users have correct balances
      for (const user of [user1, user2, user3]) {
        const balance = await vaultCoin.balanceOf(user.address)
        expect(balance).to.equal(ethers.utils.parseEther("20"))

        const hasBonus = await vaultCoin.hasReceivedBonus(user.address)
        expect(hasBonus).to.be.true
      }
    })
  })

  describe("Security Tests", () => {
    it("Should prevent unauthorized gateway access", async () => {
      await expect(
        vaultCoin
          .connect(user1)
          .mintFromFiat(user2.address, ethers.utils.parseEther("100"), ethers.utils.formatBytes32String("tx1")),
      ).to.be.revertedWith("Not authorized gateway")
    })

    it("Should prevent duplicate transaction processing", async () => {
      await vaultCoin.authorizeGateway(user1.address, true)

      const txId = ethers.utils.formatBytes32String("tx1")
      await vaultCoin.connect(user1).mintFromFiat(user2.address, ethers.utils.parseEther("100"), txId)

      await expect(
        vaultCoin.connect(user1).mintFromFiat(user2.address, ethers.utils.parseEther("100"), txId),
      ).to.be.revertedWith("Transaction already processed")
    })

    it("Should respect max supply limits", async () => {
      const maxSupply = await vaultCoin.MAX_SUPPLY()
      const currentSupply = await vaultCoin.totalSupply()
      const remainingSupply = maxSupply.sub(currentSupply)

      await expect(vaultCoin.mint(user1.address, remainingSupply.add(1))).to.be.revertedWith("Exceeds max supply")
    })

    it("Should handle pausing correctly", async () => {
      await vaultCoin.pause()

      await expect(vaultCoin.registerUser(user1.address)).to.be.revertedWith("Pausable: paused")

      await vaultCoin.unpause()

      // Should work after unpause
      await vaultCoin.registerUser(user1.address)
      const balance = await vaultCoin.balanceOf(user1.address)
      expect(balance).to.equal(ethers.utils.parseEther("20"))
    })
  })
})
