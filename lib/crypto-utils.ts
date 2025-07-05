import { ethers } from "ethers"
import { createHash, randomBytes } from "crypto"

export class CryptoHandshakeService {
  private challenges = new Map<string, { challenge: string; timestamp: number }>()

  // Generate challenge for wallet verification
  generateChallenge(address: string): string {
    const challenge = randomBytes(32).toString("hex")
    const timestamp = Date.now()

    this.challenges.set(address.toLowerCase(), { challenge, timestamp })

    // Clean up old challenges (expire after 5 minutes)
    setTimeout(
      () => {
        this.challenges.delete(address.toLowerCase())
      },
      5 * 60 * 1000,
    )

    return challenge
  }

  // Verify signed challenge
  async verifyChallenge(address: string, signature: string, challenge: string): Promise<boolean> {
    try {
      const storedChallenge = this.challenges.get(address.toLowerCase())

      if (!storedChallenge || storedChallenge.challenge !== challenge) {
        return false
      }

      // Check if challenge is expired (5 minutes)
      if (Date.now() - storedChallenge.timestamp > 5 * 60 * 1000) {
        this.challenges.delete(address.toLowerCase())
        return false
      }

      // Create message to verify
      const message = `NFTVaultChain Authentication\nChallenge: ${challenge}\nTimestamp: ${storedChallenge.timestamp}`

      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature)
      const isValid = recoveredAddress.toLowerCase() === address.toLowerCase()

      if (isValid) {
        this.challenges.delete(address.toLowerCase())
      }

      return isValid
    } catch (error) {
      console.error("Error verifying challenge:", error)
      return false
    }
  }

  // Generate secure session token
  generateSessionToken(address: string): string {
    const timestamp = Date.now()
    const random = randomBytes(16).toString("hex")
    const data = `${address}:${timestamp}:${random}`
    return createHash("sha256").update(data).digest("hex")
  }

  // Encrypt sensitive data
  encryptData(data: string, key: string): string {
    const cipher = createHash("sha256").update(key).digest()
    // Simple XOR encryption for demo (use proper encryption in production)
    let encrypted = ""
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ cipher[i % cipher.length])
    }
    return Buffer.from(encrypted).toString("base64")
  }

  // Decrypt sensitive data
  decryptData(encryptedData: string, key: string): string {
    const cipher = createHash("sha256").update(key).digest()
    const data = Buffer.from(encryptedData, "base64").toString()
    let decrypted = ""
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ cipher[i % cipher.length])
    }
    return decrypted
  }
}

export const cryptoHandshake = new CryptoHandshakeService()
