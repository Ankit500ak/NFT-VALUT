"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Wallet,
  TrendingUp,
  ImageIcon,
  Share,
  DollarSign,
  Award,
  Activity,
  Coins,
  PieChart,
  BarChart3,
  Loader2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getVaultCoinContract } from "@/lib/contracts"
import { useWeb3 } from "@/contexts/web3-context"

interface UserDashboardProps {
  provider: any
  account: string
}

interface UserStats {
  totalValue: number
  nftsCreated: number
  sharesOwned: number
  totalEarnings: number
  vaultBalance: number
}

interface NFTItem {
  id: number
  title: string
  image: string
  sharesOwned: number
  totalShares: number
  currentValue: number
  change24h: number
  isCreator: boolean
}

interface Transaction {
  id: string
  type: "mint" | "buy" | "sell"
  nftTitle: string
  amount: number
  price: number
  timestamp: number
  status: "completed" | "pending" | "failed"
}

export default function UserDashboard({ provider, account }: UserDashboardProps) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [userStats, setUserStats] = useState<UserStats>({
    totalValue: 0,
    nftsCreated: 0,
    sharesOwned: 0,
    totalEarnings: 0,
    vaultBalance: 0,
  })
  const [ownedNfts, setOwnedNfts] = useState<NFTItem[]>([])
  const [createdNfts, setCreatedNfts] = useState<NFTItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const { toast } = useToast()
  const { signer } = useWeb3()

  // Mock data
  const mockOwnedNfts: NFTItem[] = [
    {
      id: 1,
      title: "Digital Sunset",
      image: "/placeholder.svg?height=100&width=100",
      sharesOwned: 25,
      totalShares: 100,
      currentValue: 1.25,
      change24h: 5.2,
      isCreator: false,
    },
    {
      id: 2,
      title: "Cyber Punk City",
      image: "/placeholder.svg?height=100&width=100",
      sharesOwned: 15,
      totalShares: 100,
      currentValue: 1.2,
      change24h: -2.1,
      isCreator: false,
    },
  ]

  const mockCreatedNfts: NFTItem[] = [
    {
      id: 3,
      title: "My First NFT",
      image: "/placeholder.svg?height=100&width=100",
      sharesOwned: 50,
      totalShares: 100,
      currentValue: 2.5,
      change24h: 8.7,
      isCreator: true,
    },
  ]

  const mockTransactions: Transaction[] = [
    {
      id: "tx1",
      type: "mint",
      nftTitle: "My First NFT",
      amount: 1,
      price: 0.1,
      timestamp: Date.now() - 86400000,
      status: "completed",
    },
    {
      id: "tx2",
      type: "buy",
      nftTitle: "Digital Sunset",
      amount: 25,
      price: 1.25,
      timestamp: Date.now() - 172800000,
      status: "completed",
    },
    {
      id: "tx3",
      type: "buy",
      nftTitle: "Cyber Punk City",
      amount: 15,
      price: 1.2,
      timestamp: Date.now() - 259200000,
      status: "completed",
    },
  ]

  useEffect(() => {
    loadUserData()
    fetchVaultCoinBalance()
  }, [account])

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Simulate API calls
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setOwnedNfts(mockOwnedNfts)
      setCreatedNfts(mockCreatedNfts)
      setTransactions(mockTransactions)

      // Calculate stats
      const totalValue = [...mockOwnedNfts, ...mockCreatedNfts].reduce((sum, nft) => sum + nft.currentValue, 0)

      setUserStats({
        totalValue,
        nftsCreated: mockCreatedNfts.length,
        sharesOwned: mockOwnedNfts.reduce((sum, nft) => sum + nft.sharesOwned, 0),
        totalEarnings: 0.45, // Mock earnings
        vaultBalance: 125.5, // Mock VAULT balance
      })
    } catch (error) {
      console.error("Error loading user data:", error)
      toast({
        title: "Loading Error",
        description: "Failed to load user data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVaultCoinBalance = async () => {
    if (!signer || !account) return
    try {
      const vaultCoin = getVaultCoinContract(signer)
      const balance = await vaultCoin.balanceOf(account)
      setUserStats((prev) => ({ ...prev, vaultBalance: Number(balance) / 1e18 }))
    } catch (error) {
      console.error("Error fetching VaultCoin balance:", error)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "mint":
        return <ImageIcon className="w-4 h-4" />
      case "buy":
        return <TrendingUp className="w-4 h-4" />
      case "sell":
        return <DollarSign className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
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
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-gray-400">Manage your NFT portfolio and track performance</p>
        </div>
        <Badge variant="outline" className="text-white border-white/20">
          <User className="w-4 h-4 mr-2" />
          {account.slice(0, 6)}...{account.slice(-4)}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Value</p>
                <p className="text-2xl font-bold text-white">{userStats.totalValue.toFixed(2)} ETH</p>
              </div>
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">NFTs Created</p>
                <p className="text-2xl font-bold text-white">{userStats.nftsCreated}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Shares Owned</p>
                <p className="text-2xl font-bold text-white">{userStats.sharesOwned}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Share className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">{userStats.totalEarnings.toFixed(2)} ETH</p>
              </div>
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">VAULT Balance</p>
                <p className="text-2xl font-bold text-white">{userStats.vaultBalance.toFixed(1)}</p>
              </div>
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white/10">
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="owned" className="data-[state=active]:bg-white/10">
            <Share className="w-4 h-4 mr-2" />
            Owned NFTs
          </TabsTrigger>
          <TabsTrigger value="created" className="data-[state=active]:bg-white/10">
            <ImageIcon className="w-4 h-4 mr-2" />
            Created NFTs
          </TabsTrigger>
          <TabsTrigger value="transactions" className="data-[state=active]:bg-white/10">
            <Activity className="w-4 h-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Portfolio Performance */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Portfolio Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[...ownedNfts, ...createdNfts].map((nft) => (
                  <div key={nft.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white text-sm">{nft.title}</span>
                      <span className="text-white font-medium">{nft.currentValue.toFixed(2)} ETH</span>
                    </div>
                    <Progress value={(nft.currentValue / userStats.totalValue) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>
                        {nft.sharesOwned}/{nft.totalShares} shares
                      </span>
                      <span className={nft.change24h >= 0 ? "text-green-400" : "text-red-400"}>
                        {nft.change24h >= 0 ? "+" : ""}
                        {nft.change24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactions.slice(0, 5).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} {tx.nftTitle}
                        </p>
                        <p className="text-gray-400 text-xs">{formatDate(tx.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">{tx.price.toFixed(2)} ETH</p>
                      <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs">
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="owned" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Owned NFT Shares</CardTitle>
              <CardDescription className="text-gray-400">NFTs where you own fractional shares</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ownedNfts.map((nft) => (
                  <div key={nft.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                    <img
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{nft.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {nft.sharesOwned} of {nft.totalShares} shares (
                        {((nft.sharesOwned / nft.totalShares) * 100).toFixed(1)}%)
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-white font-medium">{nft.currentValue.toFixed(2)} ETH</span>
                        <span className={`text-sm ${nft.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {nft.change24h >= 0 ? "+" : ""}
                          {nft.change24h.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="created" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Created NFTs</CardTitle>
              <CardDescription className="text-gray-400">NFTs you've minted on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {createdNfts.map((nft) => (
                  <div key={nft.id} className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
                    <img
                      src={nft.image || "/placeholder.svg"}
                      alt={nft.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-white font-medium">{nft.title}</h3>
                        <Badge variant="outline" className="text-green-400 border-green-400/20">
                          <Award className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">
                        You own {nft.sharesOwned} of {nft.totalShares} shares
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-white font-medium">{nft.currentValue.toFixed(2)} ETH</span>
                        <span className={`text-sm ${nft.change24h >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {nft.change24h >= 0 ? "+" : ""}
                          {nft.change24h.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        Manage
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                      >
                        Analytics
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
              <CardDescription className="text-gray-400">All your NFT-related transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} - {tx.nftTitle}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {formatDate(tx.timestamp)} • {tx.amount} {tx.type === "mint" ? "NFT" : "shares"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{tx.price.toFixed(2)} ETH</p>
                      <Badge
                        variant={
                          tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"
                        }
                        className="text-xs"
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>My VaultCoin</CardTitle>
          <CardDescription>Your current VAULT token balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            {userStats.vaultBalance} VAULT
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
