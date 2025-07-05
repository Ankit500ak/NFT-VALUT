import { ethers } from "ethers"

// NFT Contract ABI
export const NFT_CONTRACT_ABI = [
  "function mintNFT(string memory tokenURI, uint256 totalShares, uint256 sharesToList, uint256 pricePerShare) external returns (uint256)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function totalSupply() external view returns (uint256)",
  "function getTokenShares(uint256 tokenId) external view returns (uint256, uint256)",
  "function getVaultContract(uint256 tokenId) external view returns (address)",
  "function getCreator(uint256 tokenId) external view returns (address)",
  "function buyShares(uint256 tokenId, uint256 shares) external payable",
  "function listShares(uint256 tokenId, uint256 shares, uint256 pricePerShare) external",
  "function getListingInfo(uint256 tokenId) external view returns (uint256, uint256, bool)",
  "event NFTMinted(uint256 indexed tokenId, address indexed creator, uint256 totalShares, uint256 sharesToList)",
  "event SharesPurchased(uint256 indexed tokenId, address indexed buyer, uint256 shares, uint256 totalCost)",
  "event SharesListed(uint256 indexed tokenId, address indexed seller, uint256 shares, uint256 pricePerShare)",
]

// Vault Token ABI (ERC-20)
export const VAULT_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function nftId() external view returns (uint256)",
  "function nftContract() external view returns (address)",
  "function decimals() external view returns (uint8)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
]

// Vault Factory ABI
export const VAULT_FACTORY_ABI = [
  "function createVaultToken(uint256 nftId, address nftContract, uint256 totalSupply, string memory name, string memory symbol) external returns (address)",
  "function getVaultToken(uint256 nftId, address nftContract) external view returns (address)",
  "function isVaultToken(address token) external view returns (bool)",
  "event VaultTokenCreated(uint256 indexed nftId, address indexed nftContract, address vaultToken, uint256 totalSupply)",
]

// Marketplace ABI
export const MARKETPLACE_ABI = [
  "function listNFTShares(uint256 tokenId, uint256 shares, uint256 pricePerShare) external",
  "function buyShares(uint256 tokenId, uint256 shares) external payable",
  "function cancelListing(uint256 tokenId) external",
  "function getActiveListing(uint256 tokenId) external view returns (address, uint256, uint256, bool)",
  "function getAllActiveListings() external view returns (uint256[] memory)",
  "event SharesListed(uint256 indexed tokenId, address indexed seller, uint256 shares, uint256 pricePerShare)",
  "event SharesPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 shares, uint256 totalCost)",
  "event ListingCancelled(uint256 indexed tokenId, address indexed seller)",
]

// Contract addresses - these will be set after deployment
export const CONTRACT_ADDRESSES = {
  NFT_CONTRACT: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
  VAULT_FACTORY: process.env.NEXT_PUBLIC_VAULT_FACTORY_ADDRESS,
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS,
}

export function getContract(address: string, abi: any[], signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, abi, signerOrProvider)
}

export function getNFTContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  if (!CONTRACT_ADDRESSES.NFT_CONTRACT) throw new Error("NFT_CONTRACT address is not set in environment variables.");
  return getContract(CONTRACT_ADDRESSES.NFT_CONTRACT, NFT_CONTRACT_ABI, signerOrProvider)
}

export function getVaultFactoryContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  if (!CONTRACT_ADDRESSES.VAULT_FACTORY) throw new Error("VAULT_FACTORY address is not set in environment variables.");
  return getContract(CONTRACT_ADDRESSES.VAULT_FACTORY, VAULT_FACTORY_ABI, signerOrProvider)
}

export function getMarketplaceContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  if (!CONTRACT_ADDRESSES.MARKETPLACE) throw new Error("MARKETPLACE address is not set in environment variables.");
  return getContract(CONTRACT_ADDRESSES.MARKETPLACE, MARKETPLACE_ABI, signerOrProvider)
}

export function getVaultTokenContract(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(address, VAULT_TOKEN_ABI, signerOrProvider)
}

export function getVaultCoinContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(
    process.env.NEXT_PUBLIC_VAULT_COIN_ADDRESS!,
    [
      "function balanceOf(address account) external view returns (uint256)",
      "function approve(address spender, uint256 amount) external returns (bool)",
      "function allowance(address owner, address spender) external view returns (uint256)",
      "function transfer(address to, uint256 amount) external returns (bool)"
    ],
    signerOrProvider
  )
}

export function getNFTVaultContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return getContract(
    process.env.NEXT_PUBLIC_NFT_VAULT_ADDRESS!,
    [
      "function mintingFee() external view returns (uint256)",
      "function mintNFT(string memory _ipfsHash, string memory _title, string memory _description, uint256 _royaltyPercentage, uint256 _totalShares, uint256 _sharesToList, uint256 _pricePerShare) external returns (uint256)",
      "function totalSupply() external view returns (uint256)",
      "function ownerOf(uint256 tokenId) external view returns (address)",
      "function tokenURI(uint256 tokenId) external view returns (string)",
      "function getCreator(uint256 tokenId) external view returns (address)",
      "function getTokenShares(uint256 tokenId) external view returns (uint256, uint256)",
      "function getListingInfo(uint256 tokenId) external view returns (uint256, uint256, bool)",
      "function getNFTDetails(uint256 _tokenId) external view returns (string memory ipfsHash, string memory title, string memory description, address creator, uint256 royaltyPercentage, uint256 totalShares, uint256 availableShares, uint256 pricePerShare, bool isListed, uint256 createdAt, uint256 totalRevenue)",
      "function getShareHolderBalance(uint256 _tokenId, address _holder) external view returns (uint256)",
      "function buyShares(uint256 _tokenId, uint256 _shares) external",
      "event NFTMinted(uint256 indexed tokenId, address indexed creator, string ipfsHash, string title, uint256 totalShares, uint256 timestamp)"
    ],
    signerOrProvider
  )
}
