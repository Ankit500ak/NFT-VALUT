"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useWeb3 } from "@/contexts/web3-context"
import { getNFTVaultContract, getVaultTokenContract, getVaultCoinContract } from "@/lib/contracts"
import { fetchFromIPFS, getIPFSUrl } from "@/lib/ipfs"
import { ethers } from "ethers"
import { Search, Grid, List, Eye, ShoppingCart, Loader2, ExternalLink, Coins, X } from "lucide-react"
import { CONTRACT_ADDRESSES } from "@/constants/contract-addresses"

interface NFT {
  tokenId: number
  title: string
  description: string
  image: string
  creator: string
  totalShares: number
  availableShares: number
  pricePerShare: string
  vaultContract: string
  isListed: boolean
  userShares?: number
}

interface NFTGalleryProps {
  showMyNFTs?: boolean
}

export default function NFTGallery({ showMyNFTs = false }: NFTGalleryProps) {
  const { provider, signer, account, isConnected } = useWeb3()
  const { toast } = useToast()

  const [nfts, setNfts] = useState<NFT[]>([])
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filterBy, setFilterBy] = useState("all")
  
  // Buy shares modal state
  const [buyModalOpen, setBuyModalOpen] = useState(false)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [sharesToBuy, setSharesToBuy] = useState(1)
  const [buyingShares, setBuyingShares] = useState(false)
  const [userVaultBalance, setUserVaultBalance] = useState("0")

  useEffect(() => {
    if (isConnected && provider) {
      loadNFTs()
      loadUserVaultBalance()
    }
  }, [isConnected, provider, account, showMyNFTs])

  useEffect(() => {
    applyFilters()
  }, [nfts, searchQuery, sortBy, filterBy])

  const loadUserVaultBalance = async () => {
    if (!account || !provider) return
    
    try {
      const vaultCoinContract = getVaultCoinContract(provider)
      const balance = await vaultCoinContract.balanceOf(account)
      setUserVaultBalance(ethers.formatEther(balance))
    } catch (error) {
      console.warn("Failed to load user VAULT balance:", error)
    }
  }

  const loadNFTs = async () => {
    if (!provider) return

    setLoading(true)
    try {
      const nftVaultContract = getNFTVaultContract(provider)
      const totalSupply = await nftVaultContract.totalSupply()
      if (Number(totalSupply) === 0) {
        setNfts([]);
        setLoading(false);
        return;
      }
      const nftList: NFT[] = []

      for (let i = 0; i < Number(totalSupply); i++) {
        // Skip broken NFTs with tokenId 0, 1, 2
        if ([0, 1, 2].includes(i)) continue;
        try {
          // Check if token exists by calling ownerOf
          await nftVaultContract.ownerOf(i);

          // Get all NFT details in one call
          const nftDetails = await nftVaultContract.getNFTDetails(i)
          const [ipfsHash, title, description, creator, royaltyPercentage, totalShares, availableShares, pricePerShare, isListed, createdAt, totalRevenue] = nftDetails

          // Skip if showing only user's NFTs and user is not the creator
          if (showMyNFTs && account && creator.toLowerCase() !== account.toLowerCase()) {
            continue
          }

          // Fetch metadata from IPFS
          let metadata = {
            name: title || `NFT #${i}`,
            description: description || `NFT #${i} description`,
            image: "/placeholder.svg?height=300&width=300",
          }

          try {
            if (ipfsHash) {
              metadata = await fetchFromIPFS(ipfsHash)
              console.log("NFT metadata for token", i, metadata)
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for token ${i}:`, error)
          }

          // Get user's share balance if connected
          let userShares = 0
          if (account) {
            try {
              const shareBalance = await nftVaultContract.getShareHolderBalance(i, account)
              userShares = Number(shareBalance)
            } catch (error) {
              console.warn(`Failed to get share balance for token ${i}:`, error)
            }
          }

          nftList.push({
            tokenId: i,
            title: metadata.name || title || `NFT #${i}`,
            description: metadata.description || description || "",
            image: getIPFSUrl(metadata.image) || "/placeholder.svg?height=300&width=300",
            creator,
            totalShares: Number(totalShares),
            availableShares: Number(availableShares),
            pricePerShare: ethers.formatEther(pricePerShare),
            vaultContract: "", // NFTVault doesn't have separate vault contracts
            isListed,
            userShares,
          })
        } catch (error: any) {
          // Only log warning if error is not 'ERC721: invalid token ID' or 'NFT does not exist'
          if (!error?.reason?.includes("ERC721: invalid token ID") && !error?.message?.includes("ERC721: invalid token ID") && !error?.reason?.includes("NFT does not exist") && !error?.message?.includes("NFT does not exist")) {
            console.warn(`Failed to load NFT ${i}:`, error)
          }
          // Otherwise, skip this tokenId
          continue;
        }
      }

      setNfts(nftList)
    } catch (error) {
      console.error("Error loading NFTs:", error)
      toast({
        title: "Loading Error",
        description: "Failed to load NFTs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const openBuyModal = (nft: NFT) => {
    setSelectedNFT(nft)
    setSharesToBuy(1)
    setBuyModalOpen(true)
  }

  const closeBuyModal = () => {
    setBuyModalOpen(false)
    setSelectedNFT(null)
    setSharesToBuy(1)
  }

  const calculateTotalCost = () => {
    if (!selectedNFT) return "0"
    const totalCost = Number(selectedNFT.pricePerShare) * sharesToBuy
    return totalCost.toFixed(6)
  }

  const buyShares = async () => {
    if (!signer || !account || !selectedNFT) {
      toast({
        title: "Error",
        description: "Please connect your wallet to buy shares",
        variant: "destructive",
      })
      return
    }

    if (sharesToBuy <= 0 || sharesToBuy > selectedNFT.availableShares) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a valid number of shares (1-${selectedNFT.availableShares})`,
        variant: "destructive",
      })
      return
    }

    const totalCost = Number(calculateTotalCost())
    const userBalance = Number(userVaultBalance)

    if (totalCost > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${totalCost} VAULT but have ${userBalance} VAULT`,
        variant: "destructive",
      })
      return
    }

    setBuyingShares(true)

    try {
      const nftVaultContract = getNFTVaultContract(signer)
      const vaultCoinContract = getVaultCoinContract(signer)
      const totalCostWei = ethers.parseEther(totalCost.toString())

      // Check current allowance
      const currentAllowance = await vaultCoinContract.allowance(account, process.env.NEXT_PUBLIC_NFT_VAULT_ADDRESS!)
      
      // If allowance is insufficient, approve
      if (currentAllowance < totalCostWei) {
        toast({
          title: "Approval Required",
          description: "Please approve VAULT token spending for the NFTVault contract",
        })
        
        const approveTx = await vaultCoinContract.approve(process.env.NEXT_PUBLIC_NFT_VAULT_ADDRESS!, totalCostWei)
        await approveTx.wait()
        
        toast({
          title: "Approval Confirmed",
          description: "VAULT token approval confirmed. Proceeding with purchase...",
        })
      }

      // Buy shares using VAULT tokens
      const tx = await nftVaultContract.buyShares(selectedNFT.tokenId, sharesToBuy)

      toast({
        title: "Transaction Submitted",
        description: `Buying ${sharesToBuy} shares of ${selectedNFT.title}...`,
      })

      await tx.wait()

      toast({
        title: "Purchase Successful!",
        description: `You bought ${sharesToBuy} shares of ${selectedNFT.title}`,
      })

      // Close modal and reload data
      closeBuyModal()
      await loadNFTs()
      await loadUserVaultBalance()
    } catch (error: any) {
      console.error("Purchase error:", error)

      let errorMessage = "Failed to purchase shares"
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user"
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient VAULT tokens"
      } else if (error.reason) {
        errorMessage = error.reason
      }

      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setBuyingShares(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...nfts]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (nft) =>
          nft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          nft.creator.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Category filter
    switch (filterBy) {
      case "listed":
        filtered = filtered.filter((nft) => nft.isListed)
        break
      case "owned":
        filtered = filtered.filter((nft) => nft.userShares && nft.userShares > 0)
        break
      case "created":
        filtered = filtered.filter((nft) => account && nft.creator.toLowerCase() === account.toLowerCase())
        break
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => Number.parseFloat(a.pricePerShare) - Number.parseFloat(b.pricePerShare))
        break
      case "price-high":
        filtered.sort((a, b) => Number.parseFloat(b.pricePerShare) - Number.parseFloat(a.pricePerShare))
        break
      case "shares":
        filtered.sort((a, b) => b.availableShares - a.availableShares)
        break
      case "newest":
      default:
        filtered.sort((a, b) => b.tokenId - a.tokenId)
        break
    }

    setFilteredNfts(filtered)
  }

  const openInExplorer = (tokenId: number) => {
    window.open(`https://sepolia.etherscan.io/token/${process.env.NEXT_PUBLIC_NFT_VAULT_ADDRESS}?a=${tokenId}`, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{showMyNFTs ? "My NFTs" : "NFT Gallery"}</h2>
          <p className="text-gray-400">
            {showMyNFTs ? "NFTs you've created" : "Discover and invest in fractional NFTs"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="border-white/20"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="border-white/20"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search NFTs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>

        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All NFTs</SelectItem>
            <SelectItem value="listed">Listed for Sale</SelectItem>
            {isConnected && (
              <>
                <SelectItem value="owned">My Shares</SelectItem>
                <SelectItem value="created">Created by Me</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48 bg-white/5 border-white/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="shares">Most Shares Available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="flex justify-between items-center">
        <p className="text-gray-400">
          Showing {filteredNfts.length} of {nfts.length} NFTs
        </p>
        {isConnected && (
          <div className="flex items-center space-x-2 text-sm">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-gray-400">Balance:</span>
            <span className="text-white font-medium">{userVaultBalance} VAULT</span>
          </div>
        )}
      </div>

      {/* NFT Grid/List */}
      {filteredNfts.length === 0 ? (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="text-center py-16">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No NFTs Found</h3>
            <p className="text-gray-400">
              {showMyNFTs ? "You haven't created any NFTs yet" : "No NFTs match your search criteria"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredNfts.map((nft) => (
            <Card
              key={nft.tokenId}
              className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden hover:bg-white/10 transition-all duration-200 group"
            >
              <div className="aspect-square relative">
                <img
                  src={nft.image || "/placeholder.svg"}
                  alt={nft.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {nft.isListed && <Badge className="bg-green-500/80 backdrop-blur-sm">For Sale</Badge>}
                  {nft.userShares && nft.userShares > 0 && (
                    <Badge className="bg-blue-500/80 backdrop-blur-sm">Owned</Badge>
                  )}
                  {account && nft.creator.toLowerCase() === account.toLowerCase() && (
                    <Badge className="bg-purple-500/80 backdrop-blur-sm">Created</Badge>
                  )}
                </div>

                {/* Action buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openInExplorer(nft.tokenId)}
                    className="bg-black/50 backdrop-blur-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg text-white truncate">{nft.title}</CardTitle>
                  <Badge variant="outline" className="text-gray-300 border-gray-600">
                    #{nft.tokenId}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400 text-sm line-clamp-2">{nft.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Creator */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Creator:</span>
                  <span className="text-white font-mono">
                    {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
                  </span>
                </div>

                {/* Shares info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Available:</span>
                    <span className="text-white">
                      {nft.availableShares} / {nft.totalShares} shares
                    </span>
                  </div>

                  {nft.userShares && nft.userShares > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">
                        {account && nft.creator.toLowerCase() === account.toLowerCase()
                          ? "You own:"
                          : "Creator owns:"}
                      </span>
                      <Badge variant="outline" className="text-blue-400 border-blue-400/20">
                        {nft.userShares} shares ({((nft.userShares / nft.totalShares) * 100).toFixed(1)}%)
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Price */}
                {nft.isListed && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Price per share:</span>
                    <div className="text-right">
                      <div className="text-white font-bold">{nft.pricePerShare} VAULT</div>
                    </div>
                  </div>
                )}

                {/* Action button */}
                {nft.isListed &&
                nft.availableShares > 0 &&
                account ? (
                  <Button
                    onClick={() => openBuyModal(nft)}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Buy Shares
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNfts.map((nft) => (
            <Card
              key={nft.tokenId}
              className="bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-6">
                  <img
                    src={nft.image || "/placeholder.svg"}
                    alt={nft.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">{nft.title}</h3>
                      <Badge variant="outline" className="text-gray-300 border-gray-600">
                        #{nft.tokenId}
                      </Badge>
                    </div>

                    <p className="text-gray-400 text-sm">{nft.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Creator:</span>
                        <div className="text-white font-mono">
                          {nft.creator.slice(0, 6)}...{nft.creator.slice(-4)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Available:</span>
                        <div className="text-white">
                          {nft.availableShares} / {nft.totalShares}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400">Price:</span>
                        <div className="text-white font-bold">{nft.pricePerShare} VAULT</div>
                      </div>
                      {nft.userShares && nft.userShares > 0 && (
                        <div>
                          <span className="text-gray-400">
                            {account && nft.creator.toLowerCase() === account.toLowerCase()
                              ? "You own:"
                              : "Creator owns:"}
                          </span>
                          <div className="text-blue-400">{nft.userShares} shares</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    {nft.isListed &&
                    nft.availableShares > 0 &&
                    account ? (
                      <Button
                        onClick={() => openBuyModal(nft)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy Shares
                      </Button>
                    ) : (
                      <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openInExplorer(nft.tokenId)}
                      className="text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Explorer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Buy Shares Modal */}
      <Dialog open={buyModalOpen} onOpenChange={setBuyModalOpen}>
        <DialogContent className="bg-white/5 border-white/10 backdrop-blur-sm text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-green-400" />
              <span>Buy NFT Shares</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Purchase fractional shares of {selectedNFT?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedNFT && (
            <div className="space-y-6">
              {/* NFT Info */}
              <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                <img
                  src={selectedNFT.image}
                  alt={selectedNFT.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div>
                  <h3 className="font-semibold text-white">{selectedNFT.title}</h3>
                  <p className="text-sm text-gray-400">#{selectedNFT.tokenId}</p>
                  <p className="text-sm text-gray-400">
                    {selectedNFT.availableShares} shares available
                  </p>
                </div>
              </div>

              {/* Share Input */}
              <div className="space-y-2">
                <Label htmlFor="shares" className="text-white">
                  Number of Shares
                </Label>
                <Input
                  id="shares"
                  type="number"
                  min="1"
                  max={selectedNFT.availableShares}
                  value={sharesToBuy}
                  onChange={(e) => setSharesToBuy(Number(e.target.value) || 1)}
                  className="bg-white/5 border-white/20 text-white"
                />
                <p className="text-sm text-gray-400">
                  Available: {selectedNFT.availableShares} shares
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 p-4 bg-white/5 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price per share:</span>
                  <span className="text-white">{selectedNFT.pricePerShare} VAULT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Number of shares:</span>
                  <span className="text-white">{sharesToBuy}</span>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total Cost:</span>
                    <span className="text-green-400">{calculateTotalCost()} VAULT</span>
                  </div>
                </div>
              </div>

              {/* Balance Check */}
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your VAULT Balance:</span>
                  <span className="text-white">{userVaultBalance} VAULT</span>
                </div>
                {Number(calculateTotalCost()) > Number(userVaultBalance) && (
                  <p className="text-red-400 text-sm mt-1">
                    Insufficient balance. You need {calculateTotalCost()} VAULT.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={closeBuyModal}
              disabled={buyingShares}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Cancel
            </Button>
            <Button
              onClick={buyShares}
              disabled={
                buyingShares ||
                !selectedNFT ||
                sharesToBuy <= 0 ||
                sharesToBuy > (selectedNFT?.availableShares || 0) ||
                Number(calculateTotalCost()) > Number(userVaultBalance)
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {buyingShares ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy {sharesToBuy} Shares
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
