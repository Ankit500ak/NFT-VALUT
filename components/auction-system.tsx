"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Gavel, TrendingUp, Users, Coins, Timer, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AuctionSystemProps {
  provider: ethers.BrowserProvider
  account: string
}

interface Auction {
  auctionId: number
  tokenId: number
  seller: string
  shares: number
  startingBid: number
  currentBid: number
  currentBidder: string
  startTime: number
  endTime: number
  active: boolean
  totalBids: number
  nftTitle?: string
  nftImage?: string
}

interface Bid {
  bidder: string
  amount: number
  timestamp: number
}

export default function AuctionSystem({ provider, account }: AuctionSystemProps) {
  const [activeTab, setActiveTab] = useState("browse")
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [userAuctions, setUserAuctions] = useState<Auction[]>([])
  const [userBids, setUserBids] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null)
  const [bidAmount, setBidAmount] = useState("")
  const [newAuctionData, setNewAuctionData] = useState({
    tokenId: "",
    shares: "",
    startingBid: "",
    duration: "24",
  })
  const { toast } = useToast()

  // Mock data for demonstration
  const mockAuctions: Auction[] = [
    {
      auctionId: 1,
      tokenId: 1,
      seller: "0x1234...5678",
      shares: 100,
      startingBid: 5,
      currentBid: 12.5,
      currentBidder: "0x9876...4321",
      startTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      endTime: Date.now() + 22 * 60 * 60 * 1000, // 22 hours from now
      active: true,
      totalBids: 8,
      nftTitle: "Digital Sunset",
      nftImage: "/placeholder.svg?height=200&width=200",
    },
    {
      auctionId: 2,
      tokenId: 2,
      seller: "0x5555...7777",
      shares: 50,
      startingBid: 8,
      currentBid: 8,
      currentBidder: "",
      startTime: Date.now() - 1 * 60 * 60 * 1000, // 1 hour ago
      endTime: Date.now() + 47 * 60 * 60 * 1000, // 47 hours from now
      active: true,
      totalBids: 0,
      nftTitle: "Cyber Punk City",
      nftImage: "/placeholder.svg?height=200&width=200",
    },
  ]

  useEffect(() => {
    loadAuctions()
  }, [provider, account])

  const loadAuctions = async () => {
    setIsLoading(true)
    try {
      // In real implementation, this would fetch from smart contract
      setAuctions(mockAuctions)

      // Filter user's auctions
      const userAuctions = mockAuctions.filter((auction) => auction.seller.toLowerCase() === account.toLowerCase())
      setUserAuctions(userAuctions)

      // Get user's bids (mock data)
      setUserBids([1])
    } catch (error) {
      console.error("Error loading auctions:", error)
      toast({
        title: "Loading Error",
        description: "Failed to load auctions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createAuction = async () => {
    if (!newAuctionData.tokenId || !newAuctionData.shares || !newAuctionData.startingBid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // In real implementation, this would call smart contract
      toast({
        title: "Creating Auction",
        description: "Your auction is being created...",
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Auction Created!",
        description: `Auction for ${newAuctionData.shares} shares has been created`,
      })

      // Reset form
      setNewAuctionData({
        tokenId: "",
        shares: "",
        startingBid: "",
        duration: "24",
      })

      // Reload auctions
      await loadAuctions()
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create auction",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const placeBid = async (auctionId: number) => {
    if (!bidAmount || Number.parseFloat(bidAmount) <= 0) {
      toast({
        title: "Invalid Bid",
        description: "Please enter a valid bid amount",
        variant: "destructive",
      })
      return
    }

    const auction = auctions.find((a) => a.auctionId === auctionId)
    if (!auction) return

    if (Number.parseFloat(bidAmount) <= auction.currentBid) {
      toast({
        title: "Bid Too Low",
        description: `Bid must be higher than current bid of ${auction.currentBid} VAULT`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      toast({
        title: "Placing Bid",
        description: "Your bid is being placed...",
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Bid Placed!",
        description: `Successfully bid ${bidAmount} VAULT tokens`,
      })

      setBidAmount("")
      await loadAuctions()
    } catch (error) {
      toast({
        title: "Bid Failed",
        description: "Failed to place bid",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const settleAuction = async (auctionId: number) => {
    setIsLoading(true)
    try {
      toast({
        title: "Settling Auction",
        description: "Auction is being settled...",
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Auction Settled!",
        description: "Auction has been successfully settled",
      })

      await loadAuctions()
    } catch (error) {
      toast({
        title: "Settlement Failed",
        description: "Failed to settle auction",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now()
    const remaining = endTime - now

    if (remaining <= 0) return "Ended"

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }

    return `${hours}h ${minutes}m`
  }

  const getTimeProgress = (startTime: number, endTime: number) => {
    const now = Date.now()
    const total = endTime - startTime
    const elapsed = now - startTime
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <Gavel className="w-8 h-8 mr-3 text-purple-600" />
          NFT Share Auctions
        </h2>
        <p className="text-gray-600">Bid on fractional NFT shares in live auctions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Auctions</TabsTrigger>
          <TabsTrigger value="create">Create Auction</TabsTrigger>
          <TabsTrigger value="my-auctions">My Auctions</TabsTrigger>
          <TabsTrigger value="my-bids">My Bids</TabsTrigger>
        </TabsList>

        {/* Browse Auctions */}
        <TabsContent value="browse">
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {auctions.map((auction) => (
              <Card key={auction.auctionId} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  <img
                    src={auction.nftImage || "/placeholder.svg"}
                    alt={auction.nftTitle}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 left-2 bg-purple-500">
                    <Gavel className="w-3 h-3 mr-1" />
                    Live Auction
                  </Badge>
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                    <Timer className="w-3 h-3 mr-1" />
                    {formatTimeRemaining(auction.endTime)}
                  </Badge>
                </div>

                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{auction.nftTitle}</span>
                    <Badge variant="outline">{auction.shares} shares</Badge>
                  </CardTitle>
                  <CardDescription>
                    by {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Time Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Auction Progress</span>
                      <span>{Math.round(getTimeProgress(auction.startTime, auction.endTime))}%</span>
                    </div>
                    <Progress value={getTimeProgress(auction.startTime, auction.endTime)} />
                  </div>

                  {/* Bid Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Starting Bid:</span>
                      <div className="flex items-center">
                        <Coins className="w-4 h-4 mr-1 text-yellow-600" />
                        <span className="font-semibold">{auction.startingBid} VAULT</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Current Bid:</span>
                      <div className="flex items-center">
                        <Coins className="w-4 h-4 mr-1 text-yellow-600" />
                        <span className="font-bold text-lg">
                          {auction.currentBid > 0 ? auction.currentBid : auction.startingBid} VAULT
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1 text-gray-500" />
                      <span>{auction.totalBids} bids</span>
                    </div>
                    {auction.currentBidder && (
                      <span className="text-green-600">
                        Leading: {auction.currentBidder.slice(0, 6)}...{auction.currentBidder.slice(-4)}
                      </span>
                    )}
                  </div>

                  {/* Bid Input */}
                  {auction.seller.toLowerCase() !== account.toLowerCase() && (
                    <div className="space-y-2">
                      <Label htmlFor={`bid-${auction.auctionId}`}>Your Bid (VAULT)</Label>
                      <div className="flex space-x-2">
                        <Input
                          id={`bid-${auction.auctionId}`}
                          type="number"
                          placeholder={`Min: ${(auction.currentBid > 0 ? auction.currentBid + 0.1 : auction.startingBid).toFixed(1)}`}
                          value={selectedAuction?.auctionId === auction.auctionId ? bidAmount : ""}
                          onChange={(e) => {
                            setBidAmount(e.target.value)
                            setSelectedAuction(auction)
                          }}
                          min={auction.currentBid > 0 ? auction.currentBid + 0.1 : auction.startingBid}
                          step="0.1"
                        />
                        <Button
                          onClick={() => placeBid(auction.auctionId)}
                          disabled={isLoading || !bidAmount || auction.endTime <= Date.now()}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Gavel className="w-4 h-4 mr-2" />
                          Bid
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Auction Status */}
                  {auction.endTime <= Date.now() && (
                    <div className="bg-red-50 p-3 rounded-lg">
                      <div className="flex items-center text-red-800">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="font-medium">Auction Ended</span>
                      </div>
                      {auction.currentBidder && (
                        <p className="text-sm text-red-600 mt-1">
                          Winner: {auction.currentBidder.slice(0, 6)}...{auction.currentBidder.slice(-4)}
                        </p>
                      )}
                    </div>
                  )}

                  {auction.seller.toLowerCase() === account.toLowerCase() && (
                    <Badge variant="secondary" className="w-full justify-center">
                      Your Auction
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {auctions.length === 0 && !isLoading && (
            <Card className="text-center py-16">
              <CardContent>
                <Gavel className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Auctions</h3>
                <p className="text-gray-600">Be the first to create an auction!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Create Auction */}
        <TabsContent value="create">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Create New Auction</CardTitle>
              <CardDescription>Auction your NFT shares to the highest bidder</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tokenId">NFT Token ID</Label>
                  <Input
                    id="tokenId"
                    type="number"
                    placeholder="Enter token ID"
                    value={newAuctionData.tokenId}
                    onChange={(e) => setNewAuctionData((prev) => ({ ...prev, tokenId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shares">Shares to Auction</Label>
                  <Input
                    id="shares"
                    type="number"
                    placeholder="Number of shares"
                    value={newAuctionData.shares}
                    onChange={(e) => setNewAuctionData((prev) => ({ ...prev, shares: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startingBid">Starting Bid (VAULT)</Label>
                  <Input
                    id="startingBid"
                    type="number"
                    placeholder="Minimum bid amount"
                    value={newAuctionData.startingBid}
                    onChange={(e) => setNewAuctionData((prev) => ({ ...prev, startingBid: e.target.value }))}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="Auction duration"
                    value={newAuctionData.duration}
                    onChange={(e) => setNewAuctionData((prev) => ({ ...prev, duration: e.target.value }))}
                    min="1"
                    max="720"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Auction Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Shares:</span>
                    <div className="font-semibold">{newAuctionData.shares || "0"}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Starting Bid:</span>
                    <div className="font-semibold">{newAuctionData.startingBid || "0"} VAULT</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-semibold">{newAuctionData.duration} hours</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Platform Fee:</span>
                    <div className="font-semibold">2.5%</div>
                  </div>
                </div>
              </div>

              <Button
                onClick={createAuction}
                disabled={isLoading || !newAuctionData.tokenId || !newAuctionData.shares || !newAuctionData.startingBid}
                className="w-full bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Timer className="w-5 h-5 mr-2 animate-spin" />
                    Creating Auction...
                  </>
                ) : (
                  <>
                    <Gavel className="w-5 h-5 mr-2" />
                    Create Auction
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* My Auctions */}
        <TabsContent value="my-auctions">
          <div className="space-y-4">
            {userAuctions.map((auction) => (
              <Card key={auction.auctionId}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{auction.nftTitle}</h3>
                      <p className="text-gray-600">
                        Token ID: {auction.tokenId} • {auction.shares} shares
                      </p>
                    </div>
                    <Badge className={auction.active ? "bg-green-500" : "bg-gray-500"}>
                      {auction.active ? "Active" : "Ended"}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <span className="text-sm text-gray-500">Starting Bid:</span>
                      <div className="font-semibold">{auction.startingBid} VAULT</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Current Bid:</span>
                      <div className="font-semibold">{auction.currentBid || auction.startingBid} VAULT</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total Bids:</span>
                      <div className="font-semibold">{auction.totalBids}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Time Remaining:</span>
                      <div className="font-semibold">{formatTimeRemaining(auction.endTime)}</div>
                    </div>
                  </div>

                  {auction.endTime <= Date.now() && auction.currentBidder && (
                    <div className="flex justify-end">
                      <Button onClick={() => settleAuction(auction.auctionId)} disabled={isLoading} variant="outline">
                        Settle Auction
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {userAuctions.length === 0 && (
              <Card className="text-center py-16">
                <CardContent>
                  <Gavel className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Auctions Created</h3>
                  <p className="text-gray-600">Create your first auction to get started!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* My Bids */}
        <TabsContent value="my-bids">
          <div className="space-y-4">
            {userBids.map((auctionId) => {
              const auction = auctions.find((a) => a.auctionId === auctionId)
              if (!auction) return null

              const isWinning = auction.currentBidder?.toLowerCase() === account.toLowerCase()

              return (
                <Card key={auctionId}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{auction.nftTitle}</h3>
                        <p className="text-gray-600">
                          Token ID: {auction.tokenId} • {auction.shares} shares
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={isWinning ? "bg-green-500" : "bg-blue-500"}>
                          {isWinning ? "Winning" : "Bidding"}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">{formatTimeRemaining(auction.endTime)}</div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Your Status:</span>
                        <div className="font-semibold text-lg">
                          {isWinning ? (
                            <span className="text-green-600">Leading Bidder</span>
                          ) : (
                            <span className="text-blue-600">Outbid</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Current Bid:</span>
                        <div className="font-semibold">{auction.currentBid} VAULT</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Total Bids:</span>
                        <div className="font-semibold">{auction.totalBids}</div>
                      </div>
                    </div>

                    {!isWinning && auction.active && auction.endTime > Date.now() && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          You've been outbid! Place a higher bid to regain the lead.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            {userBids.length === 0 && (
              <Card className="text-center py-16">
                <CardContent>
                  <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Bids Placed</h3>
                  <p className="text-gray-600">Start bidding on auctions to see them here!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
