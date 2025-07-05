import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { cache } from "@/lib/upstash"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const creator = searchParams.get("creator")

    // Check cache first
    const cacheKey = `nfts:${limit}:${offset}:${creator || "all"}`
    const cached = await cache.getCachedMarketData()

    if (cached) {
      return NextResponse.json(cached)
    }

    // Fetch from database
    let nfts
    if (creator) {
      nfts = await db.getNFTsByCreator(creator)
    } else {
      nfts = await db.getAllNFTs(limit, offset)
    }

    // Cache the result
    await cache.cacheMarketData(nfts, 300) // 5 minutes

    return NextResponse.json(nfts)
  } catch (error) {
    console.error("Error fetching NFTs:", error)
    return NextResponse.json({ error: "Failed to fetch NFTs" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const nftData = await request.json()

    // Validate required fields
    const requiredFields = [
      "token_id",
      "title",
      "creator_address",
      "ipfs_hash",
      "total_shares",
      "price_per_share",
      "contract_address",
      "chain_id",
    ]
    for (const field of requiredFields) {
      if (!nftData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Create NFT record
    const nft = await db.createNFT(nftData)

    // Update user stats
    await db.updateUserStats(nftData.creator_address, {
      total_nfts_created: 1, // This would be incremented in a real implementation
    })

    // Clear relevant caches
    await cache.clearCache("nfts:*")
    await cache.clearCache(`portfolio:${nftData.creator_address}`)

    return NextResponse.json(nft, { status: 201 })
  } catch (error) {
    console.error("Error creating NFT:", error)
    return NextResponse.json({ error: "Failed to create NFT" }, { status: 500 })
  }
}
