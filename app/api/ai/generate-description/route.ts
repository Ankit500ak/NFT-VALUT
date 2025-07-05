import { type NextRequest, NextResponse } from "next/server"
import { aiService } from "@/lib/ai-service"
import { cache } from "@/lib/upstash"

export async function POST(request: NextRequest) {
  try {
    const { title, style, mood } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check rate limit
    const clientIP = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = await cache.checkRateLimit(`ai-desc:${clientIP}`, 10, 3600) // 10 requests per hour

    if (rateLimit.remaining <= 0) {
      return NextResponse.json({ error: "Rate limit exceeded", resetTime: rateLimit.resetTime }, { status: 429 })
    }

    // Generate description
    const description = await aiService.generateNFTDescription(title, style, mood)

    // Increment usage counter
    await cache.incrementCounter("ai:descriptions:generated")

    return NextResponse.json({
      description,
      remaining: rateLimit.remaining - 1,
    })
  } catch (error) {
    console.error("Error generating description:", error)
    return NextResponse.json({ error: "Failed to generate description" }, { status: 500 })
  }
}
