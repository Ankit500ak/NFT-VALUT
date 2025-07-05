"use client"

import { useState, useEffect } from "react"

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

interface Proposal {
  id: string
  title: string
  description: string
  votesFor: number
  votesAgainst: number
  endTime: Date
  status: "active" | "passed" | "failed"
  category: string
}

interface MarketStats {
  totalVolume: string
  totalNFTs: number
  activeAuctions: number
  ethPrice: string
  gasPrice: string
  totalUsers: number
}

export function useRealTimeData() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalVolume: "0",
    totalNFTs: 0,
    activeAuctions: 0,
    ethPrice: "0",
    gasPrice: "0",
    totalUsers: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock NFT data
      const mockNFTs: NFT[] = [
        {
          id: "1",
          title: "Cosmic Wanderer #001",
          description: "A mystical journey through the cosmos, featuring ethereal beings exploring distant galaxies.",
          image: "/placeholder.svg?height=400&width=400",
          price: "0.25",
          totalShares: 1000,
          availableShares: 750,
          creator: "0x1234...5678",
          category: "Art",
          rarity: "legendary",
        },
        {
          id: "2",
          title: "Digital Dreams",
          description: "An abstract representation of the digital age, blending reality with virtual worlds.",
          image: "/placeholder.svg?height=400&width=400",
          price: "0.15",
          totalShares: 500,
          availableShares: 200,
          creator: "0x2345...6789",
          category: "Digital Art",
          rarity: "epic",
        },
        {
          id: "3",
          title: "Ocean Depths",
          description: "Explore the mysterious depths of the ocean with this stunning underwater scene.",
          image: "/placeholder.svg?height=400&width=400",
          price: "0.30",
          totalShares: 800,
          availableShares: 600,
          creator: "0x3456...7890",
          category: "Photography",
          rarity: "rare",
        },
        {
          id: "4",
          title: "Neon City",
          description: "A cyberpunk vision of the future city, illuminated by neon lights and digital billboards.",
          image: "/placeholder.svg?height=400&width=400",
          price: "0.20",
          totalShares: 600,
          availableShares: 450,
          creator: "0x4567...8901",
          category: "3D Art",
          rarity: "epic",
        },
        {
          id: "5",
          title: "Ancient Wisdom",
          description: "A tribute to ancient civilizations and their timeless wisdom.",
          image: "/placeholder.svg?height=400&width=400",
          price: "0.18",
          totalShares: 400,
          availableShares: 100,
          creator: "0x5678...9012",
          category: "Historical",
          rarity: "rare",
        },
        {
          id: "6",
          title: "Quantum Realm",
          description: "Journey into the quantum realm where particles dance in infinite possibilities.",
          image: "/placeholder.svg?height=400&width=400",
          price: "0.35",
          totalShares: 1200,
          availableShares: 900,
          creator: "0x6789...0123",
          category: "Science",
          rarity: "legendary",
        },
      ]

      // Mock auction data
      const mockAuctions: Auction[] = [
        {
          id: "1",
          nftId: "1",
          title: "Cosmic Wanderer Shares",
          image: "/placeholder.svg?height=400&width=400",
          currentBid: "1.25",
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          bidCount: 15,
          category: "Art",
        },
        {
          id: "2",
          nftId: "2",
          title: "Digital Dreams Collection",
          image: "/placeholder.svg?height=400&width=400",
          currentBid: "0.85",
          endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          bidCount: 8,
          category: "Digital Art",
        },
        {
          id: "3",
          nftId: "4",
          title: "Neon City Exclusive",
          image: "/placeholder.svg?height=400&width=400",
          currentBid: "2.10",
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          bidCount: 23,
          category: "3D Art",
        },
      ]

      // Mock proposal data
      const mockProposals: Proposal[] = [
        {
          id: "1",
          title: "Reduce Platform Fees",
          description:
            "Proposal to reduce platform transaction fees from 2.5% to 2.0% to encourage more trading activity.",
          votesFor: 1250,
          votesAgainst: 340,
          endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: "active",
          category: "Economics",
        },
        {
          id: "2",
          title: "Add Layer 2 Support",
          description: "Implement Polygon and Arbitrum support to reduce gas fees and improve transaction speed.",
          votesFor: 2100,
          votesAgainst: 150,
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "active",
          category: "Technical",
        },
        {
          id: "3",
          title: "Community Grant Program",
          description: "Establish a 100 ETH grant program to support emerging artists and creators on the platform.",
          votesFor: 890,
          votesAgainst: 210,
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: "active",
          category: "Community",
        },
      ]

      // Mock market stats
      const mockMarketStats: MarketStats = {
        totalVolume: "12,847",
        totalNFTs: 2456,
        activeAuctions: 23,
        ethPrice: "2,340",
        gasPrice: "25",
        totalUsers: 8934,
      }

      setNfts(mockNFTs)
      setAuctions(mockAuctions)
      setProposals(mockProposals)
      setMarketStats(mockMarketStats)
      setLoading(false)
    }

    loadData()

    // Set up polling for real-time updates
    const interval = setInterval(loadData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return {
    nfts,
    auctions,
    proposals,
    marketStats,
    loading,
  }
}
