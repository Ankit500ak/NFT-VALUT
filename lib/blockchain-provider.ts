import { ethers } from "ethers"
import { cache } from "./upstash"

// Contract ABIs (simplified for key functions)
const NFT_VAULT_ABI = [
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function getTokenShares(uint256 tokenId) view returns (uint256, uint256)",
  "function getTokenPrice(uint256 tokenId) view returns (uint256)",
  "function purchaseShares(uint256 tokenId, uint256 shares) payable",
  "function createNFT(string memory tokenURI, uint256 totalShares, uint256 pricePerShare) returns (uint256)",
  "event NFTCreated(uint256 indexed tokenId, address indexed creator, uint256 totalShares, uint256 pricePerShare)",
  "event SharesPurchased(uint256 indexed tokenId, address indexed buyer, uint256 shares, uint256 totalCost)",
]

const AUCTION_SYSTEM_ABI = [
  "function totalAuctions() view returns (uint256)",
  "function auctions(uint256 auctionId) view returns (uint256, uint256, uint256, uint256, address, bool)",
  "function getHighestBid(uint256 auctionId) view returns (uint256, address)",
  "function createAuction(uint256 tokenId, uint256 shares, uint256 startingBid, uint256 duration)",
  "function placeBid(uint256 auctionId) payable",
  "function endAuction(uint256 auctionId)",
  "event AuctionCreated(uint256 indexed auctionId, uint256 indexed tokenId, uint256 shares, uint256 startingBid)",
  "event BidPlaced(uint256 indexed auctionId, address indexed bidder, uint256 amount)",
]

const GOVERNANCE_ABI = [
  "function proposalCount() view returns (uint256)",
  "function proposals(uint256 proposalId) view returns (string, string, uint256, uint256, uint256, uint256, bool, bool)",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
  "function createProposal(string memory title, string memory description, uint256 votingPeriod)",
  "function vote(uint256 proposalId, uint8 support)",
  "function executeProposal(uint256 proposalId)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 support, uint256 weight)",
]

const VAULT_COIN_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]

export interface NFTData {
  tokenId: number
  title: string
  description: string
  image: string
  creator: string
  totalShares: number
  availableShares: number
  pricePerShare: string
  userShares?: number
}

export interface AuctionData {
  auctionId: number
  tokenId: number
  shares: number
  startingBid: string
  currentBid: string
  highestBidder: string
  endTime: number
  active: boolean
  nftData?: NFTData
}

export interface ProposalData {
  id: number
  title: string
  description: string
  forVotes: number
  againstVotes: number
  abstainVotes: number
  endTime: number
  executed: boolean
  active: boolean
}

class BlockchainProvider {
  private provider: ethers.JsonRpcProvider
  private nftVaultContract: ethers.Contract
  private auctionContract: ethers.Contract
  private governanceContract: ethers.Contract
  private vaultCoinContract: ethers.Contract

  constructor() {
    const rpcUrl =
      process.env.NEXT_PUBLIC_RPC_URL || process.env.SEPOLIA_URL || "https://eth-sepolia.g.alchemy.com/v2/demo"
    this.provider = new ethers.JsonRpcProvider(rpcUrl)

    // Initialize contracts with addresses from environment
    const nftVaultAddress = process.env.NEXT_PUBLIC_NFT_VAULT_ADDRESS
    const auctionAddress = process.env.NEXT_PUBLIC_AUCTION_SYSTEM_ADDRESS
    const governanceAddress = process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS
    const vaultCoinAddress = process.env.NEXT_PUBLIC_VAULT_COIN_ADDRESS

    if (!nftVaultAddress) throw new Error("NFT_VAULT_ADDRESS is not set in environment variables.");
    if (!auctionAddress) throw new Error("AUCTION_SYSTEM_ADDRESS is not set in environment variables.");
    if (!governanceAddress) throw new Error("GOVERNANCE_ADDRESS is not set in environment variables.");
    if (!vaultCoinAddress) throw new Error("VAULT_COIN_ADDRESS is not set in environment variables.");

    this.nftVaultContract = new ethers.Contract(nftVaultAddress, NFT_VAULT_ABI, this.provider)
    this.auctionContract = new ethers.Contract(auctionAddress, AUCTION_SYSTEM_ABI, this.provider)
    this.governanceContract = new ethers.Contract(governanceAddress, GOVERNANCE_ABI, this.provider)
    this.vaultCoinContract = new ethers.Contract(vaultCoinAddress, VAULT_COIN_ABI, this.provider)
  }

  async getAllNFTs(): Promise<NFTData[]> {
    const cacheKey = "all_nfts"
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const totalSupply = await this.nftVaultContract.totalSupply()
      const nfts: NFTData[] = []

      for (let i = 1; i <= Number(totalSupply); i++) {
        try {
          const tokenURI = await this.nftVaultContract.tokenURI(i)
          const owner = await this.nftVaultContract.ownerOf(i)
          const [totalShares, availableShares] = await this.nftVaultContract.getTokenShares(i)
          const pricePerShare = await this.nftVaultContract.getTokenPrice(i)

          // Parse metadata from tokenURI (assuming IPFS or HTTP URL)
          let metadata = {
            name: `NFT #${i}`,
            description: `NFT #${i} description`,
            image: "/placeholder.svg?height=300&width=300",
          }

          try {
            if (tokenURI.startsWith("http")) {
              const response = await fetch(tokenURI)
              if (response.ok) {
                metadata = await response.json()
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for token ${i}:`, error)
          }

          nfts.push({
            tokenId: i,
            title: metadata.name || `NFT #${i}`,
            description: metadata.description || `NFT #${i} description`,
            image: metadata.image || "/placeholder.svg?height=300&width=300",
            creator: owner,
            totalShares: Number(totalShares),
            availableShares: Number(availableShares),
            pricePerShare: ethers.formatEther(pricePerShare),
          })
        } catch (error) {
          console.warn(`Failed to fetch data for token ${i}:`, error)
        }
      }

      await cache.setex(cacheKey, 300, nfts) // Cache for 5 minutes
      return nfts
    } catch (error) {
      console.error("Failed to fetch NFTs:", error)
      return []
    }
  }

  async getAllAuctions(): Promise<AuctionData[]> {
    const cacheKey = "all_auctions"
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const totalAuctions = await this.auctionContract.totalAuctions()
      const auctions: AuctionData[] = []

      for (let i = 1; i <= Number(totalAuctions); i++) {
        try {
          const [tokenId, shares, startingBid, endTime, creator, active] = await this.auctionContract.auctions(i)
          const [currentBid, highestBidder] = await this.auctionContract.getHighestBid(i)

          auctions.push({
            auctionId: i,
            tokenId: Number(tokenId),
            shares: Number(shares),
            startingBid: ethers.formatEther(startingBid),
            currentBid: ethers.formatEther(currentBid),
            highestBidder,
            endTime: Number(endTime),
            active,
          })
        } catch (error) {
          console.warn(`Failed to fetch auction ${i}:`, error)
        }
      }

      await cache.setex(cacheKey, 60, auctions) // Cache for 1 minute
      return auctions
    } catch (error) {
      console.error("Failed to fetch auctions:", error)
      return []
    }
  }

  async getAllProposals(): Promise<ProposalData[]> {
    const cacheKey = "all_proposals"
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const proposalCount = await this.governanceContract.proposalCount()
      const proposals: ProposalData[] = []

      for (let i = 1; i <= Number(proposalCount); i++) {
        try {
          const [title, description, forVotes, againstVotes, abstainVotes, endTime, executed, active] =
            await this.governanceContract.proposals(i)

          proposals.push({
            id: i,
            title,
            description,
            forVotes: Number(forVotes),
            againstVotes: Number(againstVotes),
            abstainVotes: Number(abstainVotes),
            endTime: Number(endTime),
            executed,
            active,
          })
        } catch (error) {
          console.warn(`Failed to fetch proposal ${i}:`, error)
        }
      }

      await cache.setex(cacheKey, 300, proposals) // Cache for 5 minutes
      return proposals
    } catch (error) {
      console.error("Failed to fetch proposals:", error)
      return []
    }
  }

  async getUserVaultBalance(address: string): Promise<string> {
    try {
      const balance = await this.vaultCoinContract.balanceOf(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error("Failed to fetch vault balance:", error)
      return "0"
    }
  }

  async getUserNFTs(address: string): Promise<{ created: NFTData[]; owned: NFTData[] }> {
    const allNFTs = await this.getAllNFTs()

    const created = allNFTs.filter((nft) => nft.creator.toLowerCase() === address.toLowerCase())
    const owned = allNFTs.filter((nft) => nft.userShares && nft.userShares > 0)

    return { created, owned }
  }

  getProvider(): ethers.JsonRpcProvider {
    return this.provider
  }

  getContracts() {
    return {
      nftVault: this.nftVaultContract,
      auction: this.auctionContract,
      governance: this.governanceContract,
      vaultCoin: this.vaultCoinContract,
    }
  }
}

export const blockchainProvider = new BlockchainProvider()
