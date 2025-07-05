"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  ImageIcon,
  TrendingUp,
  Clock,
  Award,
  Activity,
  Coins,
  Share2,
  Eye,
  Heart,
  ExternalLink,
} from "lucide-react"
import { getVaultCoinContract } from "@/lib/contracts"
import { useWeb3 } from "@/contexts/web3-context"

interface UserProfileProps {
  provider: ethers.BrowserProvider
  account: string
  votingPower: number
}

interface NFT {
  tokenId: number
  title: string
  image: string
  creator: string
  shares: number
  totalShares: number
  value: number
  views: number
  likes: number
  createdAt: number
}

interface Transaction {
  id: string
  type: "mint" | "buy" | "sell" | "transfer" | "vote" | "auction"
  amount: number
  tokenId?: number
  timestamp: number
  status: "completed" | "pending" | "failed"
  hash: string
}

interface UserStats {
  totalNFTs: number
  totalValue: number
  totalShares: number
  totalVotes: number
  memberSince: number
  profileViews: number
  achievements: string[]
}

export default function UserProfile({ provider, account, votingPower }: UserProfileProps) {
  const { signer } = useWeb3()
  const [activeTab, setActiveTab] = useState("overview")
  const [userNFTs, setUserNFTs] = useState<NFT[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [vaultBalance, setVaultBalance] = useState(0)

  // Mock data for demonstration
  const mockNFTs: NFT[] = [
    {
      tokenId: 1,
      title: "Digital Sunset",
      image: "/placeholder.svg?height=200&width=200",
      creator: account,
      shares: 75,
      totalShares: 100,
      value: 2.5,
      views: 1234,
      likes: 89,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    },
    {
      tokenId: 3,
      title: "Abstract Dreams",
      image: "/placeholder.svg?height=200&width=200",
      creator: account,
      shares: 100,
      totalShares: 100,
      value: 1.8,
      views: 567,
      likes: 34,
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    },
  ]

  const mockTransactions: Transaction[] = [
    {
      id: "1",
      type: "mint",
      amount: 0.02,
      tokenId: 1,
      timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
      status: "completed",
      hash: "0x1234...5678",
    },
    {
      id: "2",
      type: "sell",
      amount: 0.5,
      tokenId: 1,
      timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      status: "completed",
      hash: "0x2345...6789",
    },
    {
      id: "3",
      type: "vote",
      amount: 0,
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
      status: "completed",
      hash: "0x3456...7890",
    },
    {
      id: "4",
      type: "buy",
      amount: 1.2,
      tokenId: 2,
      timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
      status: "completed",
      hash: "0x4567...8901",
    },
  ]

  const mockStats: UserStats = {
    totalNFTs: 2,
    totalValue: 4.3,
    totalShares: 175,
    totalVotes: 5,
    memberSince: Date.now() - 30 * 24 * 60 * 60 * 1000,
    profileViews: 234,
    achievements: ["Early Adopter", "Active Voter", "NFT Creator", "Community Member"],
  }

  useEffect(() => {
    loadUserData()
    fetchVaultCoinBalance()
  }, [provider, account])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      // In real implementation, this would fetch from smart contract and database
      setUserNFTs(mockNFTs)
      setTransactions(mockTransactions)
      setUserStats(mockStats)
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVaultCoinBalance = async () => {
    if (!signer || !account) return
    try {
      const vaultCoin = getVaultCoinContract(signer)
      const balance = await vaultCoin.balanceOf(account)
      setVaultBalance(Number(balance) / 1e18)
    } catch (error) {
      console.error("Error fetching VaultCoin balance:", error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    return `${days} days ago`
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "mint":
        return <ImageIcon className="w-4 h-4" />
      case "buy":
        return <TrendingUp className="w-4 h-4" />
      case "sell":
        return <Coins className="w-4 h-4" />
      case "vote":
        return <Award className="w-4 h-4" />
      case "auction":
        return <Clock className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "mint":
        return "text-blue-600"
      case "buy":
        return "text-green-600"
      case "sell":
        return "text-orange-600"
      case "vote":
        return "text-purple-600"
      case "auction":
        return "text-indigo-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "pending":
        return "bg-yellow-500"
      case "failed":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (!userStats) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-8">
          <div className="flex items-center space-x-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="text-2xl">{account.slice(2, 4).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {account.slice(0, 6)}...{account.slice(-4)}
              </h1>
              <p className="text-gray-600 mb-4">Member since {formatDate(userStats.memberSince)}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{userStats.totalNFTs}</div>
                  <div className="text-sm text-gray-500">NFTs Owned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userStats.totalValue.toFixed(2)} ETH</div>
                  <div className="text-sm text-gray-500">Portfolio Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{vaultBalance.toFixed(0)}</div>
                  <div className="text-sm text-gray-500">VAULT Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{votingPower}</div>
                  <div className="text-sm text-gray-500">Voting Power</div>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {userStats.achievements.map((achievement, index) => (
                <Badge key={index} variant="secondary" className="flex items-center">
                  <Award className="w-3 h-3 mr-1" />
                  {achievement}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="nfts">My NFTs</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Portfolio Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Portfolio Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total NFTs:</span>
                  <span className="font-semibold">{userStats.totalNFTs}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Shares:</span>
                  <span className="font-semibold">{userStats.totalShares}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Portfolio Value:</span>
                  <span className="font-semibold">{userStats.totalValue.toFixed(2)} ETH</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span>VAULT Balance:</span>
                  <span className="font-semibold">{vaultBalance.toFixed(2)} VAULT</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Voting Power:</span>
                  <span className="font-semibold">{votingPower}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full bg-gray-100 ${getTransactionColor(tx.type)}`}>
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{tx.type}</div>
                          <div className="text-sm text-gray-500">{formatTimeAgo(tx.timestamp)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {tx.amount > 0 && (
                          <div className="font-semibold">
                            {tx.type === "sell" ? "+" : "-"}
                            {tx.amount} ETH
                          </div>
                        )}
                        <Badge className={`${getStatusColor(tx.status)} text-white text-xs`}>{tx.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My NFTs */}
        <TabsContent value="nfts">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userNFTs.map((nft) => (
              <Card key={nft.tokenId} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative">
                  <img src={nft.image || "/placeholder.svg"} alt={nft.title} className="w-full h-full object-cover" />
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white">#{nft.tokenId}</Badge>
                </div>

                <CardHeader>
                  <CardTitle className="text-lg">{nft.title}</CardTitle>
                  <CardDescription>Created {formatTimeAgo(nft.createdAt)}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Ownership */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Your Ownership:</span>
                      <span>{Math.round((nft.shares / nft.totalShares) * 100)}%</span>
                    </div>
                    <Progress value={(nft.shares / nft.totalShares) * 100} />
                    <div className="text-xs text-gray-500 mt-1">
                      {nft.shares} of {nft.totalShares} shares
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center text-gray-500">
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="text-sm">{nft.views}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center text-gray-500">
                        <Heart className="w-4 h-4 mr-1" />
                        <span className="text-sm">{nft.likes}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center text-gray-500">
                        <Coins className="w-4 h-4 mr-1" />
                        <span className="text-sm">{nft.value} ETH</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      <Share2 className="w-4 h-4 mr-2" />
                      Sell Shares
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {userNFTs.length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No NFTs Yet</h3>
                <p className="text-gray-600">Start by minting your first NFT!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>All your blockchain transactions on NFTVaultChain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full bg-gray-100 ${getTransactionColor(tx.type)}`}>
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <div className="font-medium capitalize">{tx.type}</div>
                        {tx.tokenId && <div className="text-sm text-gray-500">Token ID: {tx.tokenId}</div>}
                        <div className="text-sm text-gray-500">{formatDate(tx.timestamp)}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      {tx.amount > 0 && (
                        <div className={`font-semibold ${tx.type === "sell" ? "text-green-600" : "text-red-600"}`}>
                          {tx.type === "sell" ? "+" : "-"}
                          {tx.amount} ETH
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`${getStatusColor(tx.status)} text-white`}>{tx.status}</Badge>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Governance Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Governance Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Votes Cast:</span>
                  <span className="font-semibold">{userStats.totalVotes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Proposals Created:</span>
                  <span className="font-semibold">1</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Voting Power:</span>
                  <span className="font-semibold">{votingPower}</span>
                </div>
                <Separator />
                <div className="text-sm text-gray-600">
                  <p>Your governance participation helps shape the future of NFTVaultChain.</p>
                </div>
              </CardContent>
            </Card>

            {/* Social Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Social Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Profile Views:</span>
                  <span className="font-semibold">{userStats.profileViews}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Likes Received:</span>
                  <span className="font-semibold">{userNFTs.reduce((sum, nft) => sum + nft.likes, 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Views:</span>
                  <span className="font-semibold">{userNFTs.reduce((sum, nft) => sum + nft.views, 0)}</span>
                </div>
                <Separator />
                <div className="text-sm text-gray-600">
                  <p>Build your reputation by creating quality NFTs and participating in the community.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>My VaultCoin</CardTitle>
          <CardDescription>Your current VAULT token balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            {vaultBalance} VAULT
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
