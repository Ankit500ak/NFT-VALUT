"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Gavel, TrendingUp, Zap } from "lucide-react"
import { useEffect, useState } from "react"

interface Auction {
  id: string
  nftId: string
  title: string
  image: string
  currentBid: string
  endTime: Date
  bidCount: number
  category: string
}

interface AuctionCardProps {
  auction: Auction
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const [timeLeft, setTimeLeft] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime()
      const endTime = auction.endTime.getTime()
      const difference = endTime - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`)
          setIsUrgent(false)
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
          setIsUrgent(hours < 2)
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`)
          setIsUrgent(true)
        }
      } else {
        setTimeLeft("Ended")
        setIsUrgent(false)
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [auction.endTime])

  return (
    <Card
      className="group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white to-orange-50 border-0 shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="p-0 relative">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={auction.image || "/placeholder.svg"}
            alt={auction.title}
            className={`w-full h-64 object-cover transition-transform duration-700 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Time left badge */}
          <div className="absolute top-3 left-3">
            <Badge
              className={`${
                isUrgent ? "bg-red-500 animate-pulse" : timeLeft === "Ended" ? "bg-gray-500" : "bg-orange-500"
              } text-white border-0 shadow-lg`}
            >
              <Clock className="w-3 h-3 mr-1" />
              {timeLeft}
            </Badge>
          </div>

          {/* Category badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-white/90 text-gray-800 border-0">
              {auction.category}
            </Badge>
          </div>

          {/* Live indicator */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white text-xs font-medium">LIVE AUCTION</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-orange-600 transition-colors">
            {auction.title}
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
            <div>
              <div className="text-sm text-gray-600 mb-1">Current Bid</div>
              <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {auction.currentBid} ETH
              </div>
              <div className="text-xs text-gray-500">≈ $5,490</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Next Min Bid</div>
              <div className="text-lg font-semibold text-gray-800">
                {(Number.parseFloat(auction.currentBid) + 0.1).toFixed(1)} ETH
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{auction.bidCount} bids</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>+{Math.floor(Math.random() * 50 + 10)}% from start</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0">
        <Button
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all text-lg py-6"
          disabled={timeLeft === "Ended"}
        >
          <Gavel className="w-5 h-5 mr-2" />
          {timeLeft === "Ended" ? "Auction Ended" : "Place Bid"}
        </Button>
      </CardFooter>
    </Card>
  )
}
