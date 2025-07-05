import { cache } from "./upstash"

interface IPFSMetadata {
  name: string
  description: string
  image: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

class IPFSService {
  private pinataGateway: string
  private pinataApiKey: string
  private pinataSecretKey: string

  constructor() {
    this.pinataGateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"
    this.pinataApiKey = process.env.PINATA_API_KEY || ""
    this.pinataSecretKey = process.env.PINATA_SECRET_API_KEY || ""
  }

  private extractIPFSHash(url: string): string | null {
    // Handle various IPFS URL formats
    const patterns = [
      /ipfs:\/\/([a-zA-Z0-9]+)/,
      /\/ipfs\/([a-zA-Z0-9]+)/,
      /https?:\/\/[^/]+\/ipfs\/([a-zA-Z0-9]+)/,
      /^([a-zA-Z0-9]+)$/, // Direct hash
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }

  private buildIPFSUrl(hash: string): string {
    return `${this.pinataGateway}/ipfs/${hash}`
  }

  async fetchMetadata(tokenURI: string): Promise<IPFSMetadata | null> {
    const cacheKey = `ipfs_metadata_${tokenURI}`
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      let fetchUrl = tokenURI

      // If it's an IPFS URL, convert to HTTP gateway URL
      const ipfsHash = this.extractIPFSHash(tokenURI)
      if (ipfsHash) {
        fetchUrl = this.buildIPFSUrl(ipfsHash)
      }

      const response = await fetch(fetchUrl, {
        headers: {
          Accept: "application/json",
        },
        timeout: 10000, // 10 second timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const metadata: IPFSMetadata = await response.json()

      // Validate required fields
      if (!metadata.name || !metadata.description) {
        throw new Error("Invalid metadata: missing required fields")
      }

      // Convert IPFS image URLs to HTTP gateway URLs
      if (metadata.image) {
        const imageHash = this.extractIPFSHash(metadata.image)
        if (imageHash) {
          metadata.image = this.buildIPFSUrl(imageHash)
        }
      }

      // Cache for 1 hour
      await cache.setex(cacheKey, 3600, metadata)
      return metadata
    } catch (error) {
      console.error("Failed to fetch IPFS metadata:", error)
      return null
    }
  }

  async fetchImage(imageUrl: string): Promise<string> {
    const cacheKey = `ipfs_image_${imageUrl}`
    const cached = await cache.get(cacheKey)

    if (cached) {
      return cached
    }

    try {
      let fetchUrl = imageUrl

      // If it's an IPFS URL, convert to HTTP gateway URL
      const ipfsHash = this.extractIPFSHash(imageUrl)
      if (ipfsHash) {
        fetchUrl = this.buildIPFSUrl(ipfsHash)
      }

      // Validate that the URL returns an image
      const response = await fetch(fetchUrl, {
        method: "HEAD",
        timeout: 5000,
      })

      if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
        await cache.setex(cacheKey, 3600, fetchUrl) // Cache for 1 hour
        return fetchUrl
      }

      throw new Error("Invalid image URL")
    } catch (error) {
      console.error("Failed to fetch IPFS image:", error)
      return "/placeholder.svg?height=300&width=300"
    }
  }

  async uploadToIPFS(data: any): Promise<string> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error("Pinata API credentials not configured")
    }

    try {
      const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretKey,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `NFTVaultChain-${Date.now()}`,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Pinata API error: ${response.status}`)
      }

      const result = await response.json()
      return result.IpfsHash
    } catch (error) {
      console.error("Failed to upload to IPFS:", error)
      throw error
    }
  }

  async uploadFileToIPFS(file: File): Promise<string> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      throw new Error("Pinata API credentials not configured")
    }

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append(
        "pinataMetadata",
        JSON.stringify({
          name: `NFTVaultChain-${file.name}-${Date.now()}`,
        }),
      )

      const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          pinata_api_key: this.pinataApiKey,
          pinata_secret_api_key: this.pinataSecretKey,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Pinata API error: ${response.status}`)
      }

      const result = await response.json()
      return result.IpfsHash
    } catch (error) {
      console.error("Failed to upload file to IPFS:", error)
      throw error
    }
  }
}

export const ipfsService = new IPFSService()
