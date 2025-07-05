"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Filter,
  Grid,
  List,
  TrendingUp,
  Heart,
  Eye,
  Share2,
  ShoppingCart,
  Star,
  Clock,
  Users,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EnhancedMarketplaceProps {
  provider: ethers.BrowserProvider
  account: string
}

interface NFTListing {
  tokenId: number
  title: string
  description: string
  image: string
  creator: string
  owner: string
  price: number
  shares: number
  totalShares: number
  category: string
  tags: string[]
  views: number
  likes: number
  createdAt: number
  listedAt: number
  isAuction: boolean
  auctionEndTime?: number
  highestBid?: number
  verified: boolean
  featured: boolean
}

interface FilterOptions {
  category: string
  priceRange: [number, number]
  creator: string
  sortBy: string
  sortOrder: "asc" | "desc"
  showAuctions: boolean
  showVerified: boolean
  showFeatured: boolean
}

export default function EnhancedMarketplace({ provider, account }: EnhancedMarketplaceProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [listings, setListings] = useState<NFTListing[]>([])
  const [filteredListings, setFilteredListings] = useState<NFTListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [likedNFTs, setLikedNFTs] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState<FilterOptions>({
    category: "all",
    priceRange: [0, 100],
    creator: "",
    sortBy: "newest",
    sortOrder: "desc",
    showAuctions: true,
    showVerified: false,
    showFeatured: false,
  })
  const { toast } = useToast()

  // Mock data for demonstration
  const mockListings: NFTListing[] = [
    {
      tokenId: 1,
      title: "Digital Sunset",
      description: "A beautiful digital representation of a sunset over the mountains",
      image: "/placeholder.svg?height=300&width=300",
      creator: "0x1234...5678",
      owner: "0x1234...5678",
      price: 2.5,
      shares: 25,
      totalShares: 100,
      category: "Art",
      tags: ["landscape", "digital", "sunset"],
      views: 1234,
      likes: 89,
      createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      listedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      isAuction: false,
      verified: true,
      featured: true,
    },
    {
      tokenId: 2,
      title: "Cyber Punk City",
      description: "Futuristic cityscape with neon lights and cyberpunk aesthetics",
      image: "/placeholder.svg?height=300&width=300",
      creator: "0x9876...4321",
      owner: "0x9876...4321",
      price: 1.8,
      shares: 50,
      totalShares: 100,
      category: "Digital Art",
      tags: ["cyberpunk", "city", "neon"],
      views: 856,
      likes: 67,
      createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
      listedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      isAuction: true,
      auctionEndTime: Date.now() + 2 * 24 * 60 * 60 * 1000,
      highestBid: 2.1,
      verified: false,
      featured: false,
    },
    {
      tokenId: 3,
      title: "Abstract Dreams",
      description: "An abstract composition exploring the boundaries of imagination",
      image: "/placeholder.svg?height=300&width=300",
      creator: "0x5555...7777",
      owner: "0x5555...7777",
      price: 3.2,
      shares: 100,
      totalShares: 100,
      category: "Abstract",
      tags: ["abstract", "dreams", "colorful"],
      views: 2341,
      likes: 156,
      createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000,
      listedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      isAuction: false,
      verified: true,
      featured: false,
    },
    {
      tokenId: 4,
      title: "Ocean Waves",
      description: "Mesmerizing ocean waves captured in digital form",
      image: "/placeholder.svg?height=300&width=300",
      creator: "0x3333...9999",
      owner: "0x3333...9999",
      price: 1.5,
      shares: 75,
      totalShares: 100,
      category: "Nature",
      tags: ["ocean", "waves", "blue"],
      views: 678,
      likes: 45,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      listedAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
      isAuction: false,
      verified: false,
      featured: true,
    },
  ]

  const categories = ["All", "Art", "Digital Art", "Abstract", "Nature", "Photography", "Music", "Gaming"]

  useEffect(() => {
    loadListings()
  }, [provider, account])

  useEffect(() => {
    applyFilters()
  }, [listings, searchQuery, filters])

  const loadListings = async () => {
    setIsLoading(true)
    try {
      // In real implementation, this would fetch from smart contract
      setListings(mockListings)
    } catch (error) {
      console.error("Error loading listings:", error)
      toast({
        title: "Loading Error",
        description: "Failed to load marketplace listings",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...listings]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (listing) =>
          listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((listing) => listing.category.toLowerCase() === filters.category.toLowerCase())
    }

    // Price range filter
    filtered = filtered.filter(
      (listing) => listing.price >= filters.priceRange[0] && listing.price <= filters.priceRange[1],
    )

    // Creator filter
    if (filters.creator) {
      filtered = filtered.filter((listing) => listing.creator.toLowerCase().includes(filters.creator.toLowerCase()))
    }

    // Auction filter
    if (!filters.showAuctions) {
      filtered = filtered.filter((listing) => !listing.isAuction)
    }

    // Verified filter
    if (filters.showVerified) {
      filtered = filtered.filter((listing) => listing.verified)
    }

    // Featured filter
    if (filters.showFeatured) {
      filtered = filtered.filter((listing) => listing.featured)
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case "price":
          comparison = a.price - b.price
          break
        case "likes":
          comparison = a.likes - b.likes
          break
        case "views":
          comparison = a.views - b.views
          break
        case "newest":
          comparison = a.listedAt - b.listedAt
          break
        case "oldest":
          comparison = b.listedAt - a.listedAt
          break
        default:
          comparison = a.listedAt - b.listedAt
      }

      return filters.sortOrder === "asc" ? comparison : -comparison
    })

    setFilteredListings(filtered)
  }

  const toggleLike = (tokenId: number) => {
    const newLikedNFTs = new Set(likedNFTs)
    if (newLikedNFTs.has(tokenId)) {
      newLikedNFTs.delete(tokenId)
    } else {
      newLikedNFTs.add(tokenId)
    }
    setLikedNFTs(newLikedNFTs)
  }

  const buyShares = async (tokenId: number, shares: number, price: number) => {
    setIsLoading(true)
    try {
      toast({
        title: "Processing Purchase",
        description: `Buying ${shares} shares for ${price} ETH...`,
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Purchase Successful!",
        description: `Successfully purchased ${shares} shares`,
      })
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Failed to complete purchase",
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

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const resetFilters = () => {
    setFilters({
      category: "all",
      priceRange: [0, 100],
      creator: "",
      sortBy: "newest",
      sortOrder: "desc",
      showAuctions: true,
      showVerified: false,
      showFeatured: false,
    })
    setSearchQuery("")
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Enhanced Marketplace</h2>
        <p className="text-gray-600">Discover, buy, and trade fractional NFT shares</p>
      </div>

      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search NFTs, creators, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex space-x-2">
          <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          <div className="flex border rounded-lg">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}>
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Filters</CardTitle>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category} value={category.toLowerCase()}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label>Price Range (ETH)</Label>
                <div className="px-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, priceRange: value as [number, number] }))
                    }
                    max={100}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>{filters.priceRange[0]} ETH</span>
                    <span>{filters.priceRange[1]} ETH</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label>Sort By</Label>
                <div className="flex space-x-2">
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                      <SelectItem value="likes">Most Liked</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
                      }))
                    }
                  >
                    {filters.sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="space-y-3">
                <Label>Additional Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showAuctions"
                      checked={filters.showAuctions}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, showAuctions: checked as boolean }))
                      }
                    />
                    <Label htmlFor="showAuctions" className="text-sm">
                      Include Auctions
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showVerified"
                      checked={filters.showVerified}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, showVerified: checked as boolean }))
                      }
                    />
                    <Label htmlFor="showVerified" className="text-sm">
                      Verified Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showFeatured"
                      checked={filters.showFeatured}
                      onCheckedChange={(checked) =>
                        setFilters((prev) => ({ ...prev, showFeatured: checked as boolean }))
                      }
                    />
                    <Label htmlFor="showFeatured" className="text-sm">
                      Featured Only
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600">
          Showing {filteredListings.length} of {listings.length} NFTs
        </p>
        <div className="flex items-center space-x-2">
          {filters.showVerified && <Badge variant="secondary">Verified</Badge>}
          {filters.showFeatured && <Badge variant="secondary">Featured</Badge>}
          {filters.category !== "all" && <Badge variant="secondary">{filters.category}</Badge>}
        </div>
      </div>

      {/* NFT Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.tokenId} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="aspect-square relative">
                <img
                  src={listing.image || "/placeholder.svg"}
                  alt={listing.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1">
                  {listing.featured && (
                    <Badge className="bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  {listing.verified && <Badge className="bg-blue-500 text-white">Verified</Badge>}
                  {listing.isAuction && (
                    <Badge className="bg-purple-500 text-white">
                      <Clock className="w-3 h-3 mr-1" />
                      Auction
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => toggleLike(listing.tokenId)}
                    className={likedNFTs.has(listing.tokenId) ? "text-red-500" : ""}
                  >
                    <Heart className={`w-4 h-4 ${likedNFTs.has(listing.tokenId) ? "fill-current" : ""}`} />
                  </Button>
                  <Button size="sm" variant="secondary">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Auction Timer */}
                {listing.isAuction && listing.auctionEndTime && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {formatTimeRemaining(listing.auctionEndTime)}
                  </div>
                )}
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg truncate">{listing.title}</CardTitle>
                  <Badge variant="outline">#{listing.tokenId}</Badge>
                </div>
                <CardDescription className="text-sm line-clamp-2">{listing.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Creator */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Creator:</span>
                  <span className="font-medium">
                    {listing.creator.slice(0, 6)}...{listing.creator.slice(-4)}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{listing.isAuction ? "Current Bid:" : "Price:"}</span>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {listing.isAuction ? listing.highestBid || listing.price : listing.price} ETH
                    </div>
                    <div className="text-xs text-gray-500">
                      {listing.shares} of {listing.totalShares} shares
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {listing.views}
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    {listing.likes}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {Math.round((1 - listing.shares / listing.totalShares) * 100)}% owned
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className="w-full"
                  onClick={() => buyShares(listing.tokenId, listing.shares, listing.price)}
                  disabled={isLoading || listing.owner.toLowerCase() === account.toLowerCase()}
                >
                  {listing.owner.toLowerCase() === account.toLowerCase() ? (
                    "You Own This"
                  ) : listing.isAuction ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Place Bid
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Shares
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <Card key={listing.tokenId} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex space-x-6">
                  <div className="w-32 h-32 relative flex-shrink-0">
                    <img
                      src={listing.image || "/placeholder.svg"}
                      alt={listing.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    {listing.isAuction && (
                      <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white">Auction</Badge>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{listing.title}</h3>
                        <p className="text-gray-600">{listing.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        {listing.featured && <Badge className="bg-yellow-500">Featured</Badge>}
                        {listing.verified && <Badge className="bg-blue-500">Verified</Badge>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Creator:</span>
                        <div className="font-medium">
                          {listing.creator.slice(0, 6)}...{listing.creator.slice(-4)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Price:</span>
                        <div className="font-bold">{listing.price} ETH</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Shares:</span>
                        <div className="font-medium">
                          {listing.shares}/{listing.totalShares}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Views:</span>
                        <div className="font-medium">{listing.views}</div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {listing.views}
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {listing.likes}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => toggleLike(listing.tokenId)}>
                          <Heart
                            className={`w-4 h-4 mr-2 ${likedNFTs.has(listing.tokenId) ? "fill-current text-red-500" : ""}`}
                          />
                          Like
                        </Button>
                        <Button
                          onClick={() => buyShares(listing.tokenId, listing.shares, listing.price)}
                          disabled={isLoading || listing.owner.toLowerCase() === account.toLowerCase()}
                        >
                          {listing.isAuction ? "Place Bid" : "Buy Shares"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredListings.length === 0 && !isLoading && (
        <Card className="text-center py-16">
          <CardContent>
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <Button onClick={resetFilters} variant="outline">
              Reset Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
