const axios = require("axios")
const FormData = require("form-data")
const fs = require("fs")

class IPFSService {
  constructor(apiKey, secretKey) {
    this.apiKey = apiKey
    this.secretKey = secretKey
    this.baseURL = "https://api.pinata.cloud"
  }

  async uploadFile(filePath, metadata = {}) {
    try {
      const formData = new FormData()
      formData.append("file", fs.createReadStream(filePath))

      const pinataMetadata = JSON.stringify({
        name: metadata.name || "NFT Asset",
        keyvalues: metadata.attributes || {},
      })
      formData.append("pinataMetadata", pinataMetadata)

      const pinataOptions = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
          regions: [
            { id: "FRA1", desiredReplicationCount: 1 },
            { id: "NYC1", desiredReplicationCount: 2 },
          ],
        },
      })
      formData.append("pinataOptions", pinataOptions)

      const response = await axios.post(`${this.baseURL}/pinning/pinFileToIPFS`, formData, {
        maxBodyLength: "Infinity",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
      })

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
      }
    } catch (error) {
      console.error("IPFS upload error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  async uploadJSON(jsonData, filename = "metadata.json") {
    try {
      const response = await axios.post(
        `${this.baseURL}/pinning/pinJSONToIPFS`,
        {
          pinataContent: jsonData,
          pinataMetadata: {
            name: filename,
          },
        },
        {
          headers: {
            pinata_api_key: this.apiKey,
            pinata_secret_api_key: this.secretKey,
          },
        },
      )

      return {
        success: true,
        ipfsHash: response.data.IpfsHash,
        pinSize: response.data.PinSize,
        timestamp: response.data.Timestamp,
      }
    } catch (error) {
      console.error("IPFS JSON upload error:", error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  async createNFTMetadata(nftData, imageHash) {
    const metadata = {
      name: nftData.title,
      description: nftData.description,
      image: `ipfs://${imageHash}`,
      external_url: `https://nftvaultchain.com/nft/${nftData.tokenId}`,
      attributes: [
        {
          trait_type: "Creator",
          value: nftData.creator,
        },
        {
          trait_type: "Total Shares",
          value: nftData.totalShares,
        },
        {
          trait_type: "Royalty Percentage",
          value: nftData.royaltyPercentage / 100,
        },
        {
          trait_type: "Created At",
          value: new Date(nftData.createdAt * 1000).toISOString(),
        },
      ],
      properties: {
        category: "NFTVaultChain",
        creators: [
          {
            address: nftData.creator,
            share: 100,
          },
        ],
      },
    }

    return await this.uploadJSON(metadata, `${nftData.title}-metadata.json`)
  }

  async getFileInfo(ipfsHash) {
    try {
      const response = await axios.get(`${this.baseURL}/data/pinList?hashContains=${ipfsHash}`, {
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.secretKey,
        },
      })

      return {
        success: true,
        data: response.data.rows[0] || null,
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      }
    }
  }

  getIPFSUrl(hash) {
    return `https://gateway.pinata.cloud/ipfs/${hash}`
  }

  getPublicGatewayUrl(hash) {
    return `https://ipfs.io/ipfs/${hash}`
  }
}

module.exports = IPFSService
