"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, Share2, Eye, Sparkles, TrendingUp } from "lucide-react"
import { useState } from "react"

interface NFT {
  id: string
  title: string
  description: string
  image: string
  price: string
  totalShares: number
  availableShares: number
  creator: string
  category: string
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface NFTCardProps {
  nft: NFT
}

const rarityColors = {
  common: "bg-gray-500",
  rare: "bg-blue-500",
  epic: "bg-purple-500",
  legendary: "bg-gradient-to-r from-yellow-400 to-orange-500",
}

const rarityIcons = {
  common: "⚪",
  rare: "🔵",
  epic: "🟣",
  legendary: "⭐",
}

export function NFTCard({ nft }: NFTCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const sharesSold = nft.totalShares - nft.availableShares
  const progressPercentage = (sharesSold / nft.totalShares) * 100

  return (
    <Card
      className="group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50 border-0 shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-0 relative">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={nft.image || "/placeholder.svg"}
            alt={nft.title}
            className={`w-full h-64 object-cover transition-transform duration-700 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Rarity badge */}
          <div className="absolute top-3 left-3">
            <Badge className={`${rarityColors[nft.rarity]} text-white border-0 shadow-lg`}>
              {rarityIcons[nft.rarity]} {nft.rarity.toUpperCase()}
            </Badge>
          </div>

          {/* Category badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 border-0">
              {nft.category}
            </Badge>
          </div>

          {/* Action buttons overlay */}
          <div
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2 transition-all duration-300 ${
              isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
            }`}
          >
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className={`bg-white/90 hover:bg-white ${isLiked ? "text-red-500" : ""}`}
              onClick={() => setIsLiked(!isLiked)}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>
            <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
            {nft.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{nft.description}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Creator</span>
          <span className="font-mono font-medium bg-gray-100 px-2 py-1 rounded-md">{nft.creator}</span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Price per share</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">{nft.price} ETH</div>
              <div className="text-xs text-gray-500">≈ $2,340</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Ownership Progress</span>
              <span className="font-medium">
                {sharesSold.toLocaleString()}/{nft.totalShares.toLocaleString()} shares
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-gray-200" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progressPercentage.toFixed(1)}% sold</span>
              <span>{nft.availableShares.toLocaleString()} available</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors bg-transparent"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          View Details
        </Button>
        <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all">
          <Sparkles className="w-4 h-4 mr-2" />
          Buy Shares
        </Button>
      </CardFooter>
    </Card>
  )
}
