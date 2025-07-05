import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { cache } from "@/lib/upstash"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "7d"

    // Check cache
    const cacheKey = `analytics:${period}`
    const cached = await cache.getCachedMarketData()

    if (cached) {
      return NextResponse.json(cached)
    }

    // Get platform stats
    const stats = await db.getPlatformStats()

    // Get trending NFTs
    const trendingNFTs = await db.getTrendingNFTs(10)

    // Get additional metrics from cache
    const totalDescriptionsGenerated = await cache.getCounter("ai:descriptions:generated")
    const totalAPIRequests = await cache.getCounter("api:requests")

    const analytics = {
      ...stats,
      trendingNFTs,
      aiMetrics: {
        descriptionsGenerated: totalDescriptionsGenerated,
        apiRequests: totalAPIRequests,
      },
      period,
    }

    // Cache for 10 minutes
    await cache.cacheMarketData(analytics, 600)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
