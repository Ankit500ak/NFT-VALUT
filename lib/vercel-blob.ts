import { put, del, list } from "@vercel/blob"

export class BlobStorageService {
  // Upload NFT image
  async uploadNFTImage(file: File, tokenId: number): Promise<string> {
    try {
      const filename = `nft-${tokenId}-${Date.now()}.${file.name.split(".").pop()}`
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      })

      return blob.url
    } catch (error) {
      console.error("Error uploading to Vercel Blob:", error)
      throw new Error("Failed to upload image")
    }
  }

  // Upload user avatar
  async uploadUserAvatar(file: File, userAddress: string): Promise<string> {
    try {
      const filename = `avatar-${userAddress}-${Date.now()}.${file.name.split(".").pop()}`
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      })

      return blob.url
    } catch (error) {
      console.error("Error uploading avatar:", error)
      throw new Error("Failed to upload avatar")
    }
  }

  // Upload NFT metadata
  async uploadMetadata(metadata: any, tokenId: number): Promise<string> {
    try {
      const filename = `metadata-${tokenId}.json`
      const blob = await put(filename, JSON.stringify(metadata), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      })

      return blob.url
    } catch (error) {
      console.error("Error uploading metadata:", error)
      throw new Error("Failed to upload metadata")
    }
  }

  // List user files
  async listUserFiles(userAddress: string) {
    try {
      const { blobs } = await list({
        prefix: `avatar-${userAddress}`,
      })

      return blobs
    } catch (error) {
      console.error("Error listing files:", error)
      throw new Error("Failed to list files")
    }
  }

  // Delete file
  async deleteFile(url: string) {
    try {
      await del(url)
    } catch (error) {
      console.error("Error deleting file:", error)
      throw new Error("Failed to delete file")
    }
  }

  // Get file info
  async getFileInfo(url: string) {
    try {
      const response = await fetch(url, { method: "HEAD" })
      return {
        size: response.headers.get("content-length"),
        type: response.headers.get("content-type"),
        lastModified: response.headers.get("last-modified"),
      }
    } catch (error) {
      console.error("Error getting file info:", error)
      return null
    }
  }
}

export const blobStorage = new BlobStorageService()
