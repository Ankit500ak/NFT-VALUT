import { cache } from "./upstash"

interface EthereumPrice {
  ethereum: {
    usd: number
    usd_24h_change: number
  }
}

interface GasPrice {
  standard: number
  fast: number
  instant: number
}

class APIClient {
  private coingeckoApiKey: string
  private baseUrl: string

  constructor() {
    this.coingeckoApiKey = process.env.COINGECKO_API_KEY || ""
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ""
  }

  async fetchEthereumPrice(): Promise<{ price: number; change24h: number }> {
    const cacheKey = "ethereum_price"
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const url = this.coingeckoApiKey
        ? `https://pro-api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true&x_cg_pro_api_key=${this.coingeckoApiKey}`
        : "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true"

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`)
      }

      const data: EthereumPrice = await response.json()

      const result = {
        price: data.ethereum.usd,
        change24h: data.ethereum.usd_24h_change,
      }

      await cache.setex(cacheKey, 300, result) // Cache for 5 minutes
      return result
    } catch (error) {
      console.error("Error fetching Ethereum price:", error)

      // Return fallback data
      const fallback = { price: 2000, change24h: 0 }
      await cache.setex(cacheKey, 60, fallback) // Cache fallback for 1 minute
      return fallback
    }
  }

  async fetchGasPrice(): Promise<GasPrice> {
    const cacheKey = "gas_price"
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = await fetch(
        "https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=" +
          (process.env.ETHERSCAN_API_KEY || "YourApiKeyToken"),
        {
          headers: {
            Accept: "application/json",
          },
          next: { revalidate: 60 }, // Cache for 1 minute
        },
      )

      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== "1") {
        throw new Error("Etherscan API returned error")
      }

      const result: GasPrice = {
        standard: Number.parseInt(data.result.SafeGasPrice),
        fast: Number.parseInt(data.result.StandardGasPrice),
        instant: Number.parseInt(data.result.FastGasPrice),
      }

      await cache.setex(cacheKey, 60, result) // Cache for 1 minute
      return result
    } catch (error) {
      console.error("Error fetching gas price:", error)

      // Return fallback data
      const fallback: GasPrice = { standard: 20, fast: 25, instant: 30 }
      await cache.setex(cacheKey, 30, fallback) // Cache fallback for 30 seconds
      return fallback
    }
  }

  async fetchNFTMetadata(tokenURI: string): Promise<any> {
    const cacheKey = `nft_metadata_${tokenURI}`
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = await fetch(tokenURI, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      })

      if (!response.ok) {
        throw new Error(`Metadata fetch error: ${response.status}`)
      }

      const metadata = await response.json()
      await cache.setex(cacheKey, 3600, metadata) // Cache for 1 hour
      return metadata
    } catch (error) {
      console.error("Error fetching NFT metadata:", error)
      return null
    }
  }

  async fetchMarketStats(): Promise<{
    totalVolume: number
    totalNFTs: number
    activeUsers: number
    avgPrice: number
  }> {
    const cacheKey = "market_stats"
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      // This would typically fetch from your backend API
      const response = await fetch(`${this.baseUrl}/api/market-stats`, {
        headers: {
          Accept: "application/json",
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (response.ok) {
        const stats = await response.json()
        await cache.setex(cacheKey, 300, stats)
        return stats
      }

      throw new Error("API not available")
    } catch (error) {
      console.error("Error fetching market stats:", error)

      // Return mock data as fallback
      const fallback = {
        totalVolume: 1250.5,
        totalNFTs: 342,
        activeUsers: 89,
        avgPrice: 0.15,
      }

      await cache.setex(cacheKey, 60, fallback)
      return fallback
    }
  }
}

export const apiClient = new APIClient()
