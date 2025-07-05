"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EnhancedNFTGalleryProps {
  provider: ethers.BrowserProvider | null
  account: string | null
}

interface NFTItem {
  id: number
  title: string
  description: string
  image: string
  creator: string
  totalShares: number
  availableShares: number
  pricePerShare: number
  royalty: number
  isListed: boolean
  likes: number
  views: number
  volume24h: number
  priceChange24h: number
  rarity: "Common" | "Rare" | "Epic" | "Legendary"
  category: string
  createdAt: string
}

export default function EnhancedNFTGallery({ provider, account }: EnhancedNFTGalleryProps) {
  const [nfts, setNfts] = useState<NFTItem[]>([])
  const [filteredNfts, setFilteredNfts] = useState<NFTItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filterBy, setFilterBy] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [selectedNFT, setSelectedNFT] = useState<NFTItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [favorites, setFavorites] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  // Enhanced mock NFT data
  const mockNFTs: NFTItem[] = [
    {
      id: 1,
      title: "Cosmic Dreams #001",
      description: "A mesmerizing journey through the cosmos, featuring swirling galaxies and nebulae in vibrant colors.",
      image: "/placeholder.svg?height=400&width=400",
      creator: "0x1234...5678",
      totalShares: 1000,
      availableShares: 300,
      pricePerShare: 2.5,
      royalty: 5,
      isListed: true,
      likes: 142,
      views: 1205,
      volume24h: 125.5,
      priceChange24h: 8.2,
      rarity: "Rare",
      category: "Art",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      title: "Digital Punk Avatar",
      description: "Unique cyberpunk-style avatar with rare accessories and glowing neon effects.",
      image: "/placeholder.svg?height=400&width=400",
      creator: "0x9876...4321",
      totalShares: 500,
      availableShares: 150,
      pricePerShare: 5.0,
      royalty: 7.5,
      isListed: true,
      likes: 89,
      views: 756,
      volume24h: 89.2,
      priceChange24h: -2.1,
      rarity: "Epic",
      category: "Avatar",
      createdAt: "2024-01-10",
    },
    {
      id: 3,
      title: "Abstract Harmony",
      description: "Mathematical precision meets artistic expression in this geometric masterpiece.",
      image: "/placeholder.svg?height=400&width=400",
      creator: "0x5555...7777",
      totalShares: 2000,
      availableShares: 0,
      pricePerShare: 1.0,
      royalty: 3,
      isListed: false,
      likes: 234,
      views: 1890,
      volume24h: 0,
      priceChange24h: 0,
      rarity: "Common",
      category: "Art",
      createdAt: "2024-01-05",
    },
    {
      id: 4,
      title: "Legendary Dragon",
      description: "Mythical dragon with ancient powers, extremely rare and powerful NFT.",
      image: "/placeholder.svg?height=400&width=400",
      creator: "0xaaaa...bbbb",
      totalShares: 100,
      availableShares: 25,
      pricePerShare: 15.0,
      royalty: 10,
      isListed: true,
      likes: 567,
      views: 3421,
      volume24h: 450.0,
      priceChange24h: 25.6,
      rarity: "Legendary",
      category: "Gaming",
      createdAt: "2024-01-20",
    },
  ]

  useEffect(() => {
    // Simulate loading NFTs
    const loadNFTs = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setNfts(mockNFTs)
      setFilteredNfts(mockNFTs)
      setIsLoading(false)
    }

    loadNFTs()
  }, [])

  useEffect(() => {
    let filtered = [...nfts]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (nft) =>
          nft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          nft.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          nft.creator.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((nft) => nft.category.toLowerCase() === categoryFilter.toLowerCase())
    }

    // Apply availability filter
    if (filterBy === "available") {
      filtered = filtered.filter((nft) => nft.isListed && nft.availableShares > 0)
    } else if (filterBy === "sold-out") {
      filtered = filtered.filter((nft) => nft.availableShares === 0)
    } else if (filterBy === "trending") {
      filtered = filtered.filter((nft) => nft.volume24h > 50)
    }

    // Apply price range filter
    if (priceRange.min) {
      filtered = filtered.filter((nft) => nft.pricePerShare >= Number.parseFloat(priceRange.min))
    }
    if (priceRange.max) {
      filtered = filtered.filter((nft) => nft.pricePerShare <= Number.parseFloat(priceRange.max))
    }

    // Apply sorting
    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.pricePerShare - b.pricePerShare)
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.pricePerShare - a.pricePerShare)
    } else if (sortBy === "popular") {
      filtered.sort((a, b) => b.likes - a.likes)
    } else if (sortBy === "volume") {
      filtered.sort((a, b) => b.volume24h - a.volume24h)
    } else if (sortBy === "rarity") {
      const rarityOrder = { "Common": 1, "Rare": 2, "Epic": 3, "Legendary": 4 }
      filtered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])
    }

    setFilteredNfts(filtered)
  }, [nfts, searchTerm, sortBy, filterBy, categoryFilter, priceRange])

  const handleBuyShares = async (nftId: number, shares: number) => {
    if (!account || !provider) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to buy shares",
        variant: "destructive",
      })
      return
    }

    try {
      toast({
        title: "Purchasing Shares",
        description: `Buying ${shares} shares...`,
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Purchase Successful! 🎉",
        description: `Successfully purchased ${shares} shares`,
      })

      // Update local state
      setNfts((prev) =>
        prev.map((nft) => (nft.id === nftId ? { ...nft, availableShares: nft.availableShares - shares } : nft))
      )
    } catch (error: any) {
      toast({
        title: "Purchase Failed",
        description: error.message || "Failed to purchase shares",
        variant: "destructive",
      })
    }
  }

  const toggleFavorite = (nftId: number) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(nftId)) {
        newFavorites.delete(nftId)
        toast({ title: "Removed from favorites" })
      } else {
        newFavorites.add(nftId)
        toast({ title: "Added to favorites" })
      }
      return newFavorites
    })
  }

  const shareNFT = (nft: NFTItem) => {
    const url = `${window.location.origin}/nft/${nft.id}`
    navigator.clipboard.writeText(url)
    toast({
      title: "Link Copied",
      description: "NFT link copied to clipboard",
    })
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "Common": return "bg-gray-100 text-gray-800"
      case "Rare": return "bg-blue-100 text-blue-800"
      case "Epic": return "bg-purple-100 text-purple-800"
      case "Legendary": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Enhanced NFT Gallery...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Enhanced NFT Gallery</h2>
        <p className="text-gray-600">Discover, analyze, and invest in premium digital artworks</p>
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <Tabs defaultValue="filters" className="space-y-4">
            <TabsList>
              <TabsTrigger value="filters">Filters</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="filters">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search NFTs, creators..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="avatar">Avatar</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>\
