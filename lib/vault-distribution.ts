import { ethers } from "ethers"
import { db } from "./database"
import { cache } from "./upstash"

export class VaultDistributionService {
  private readonly WELCOME_BONUS = ethers.parseEther("20") // 20 VAULT tokens
  private readonly DAILY_BONUS = ethers.parseEther("1") // 1 VAULT token daily
  private readonly REFERRAL_BONUS = ethers.parseEther("5") // 5 VAULT tokens for referrals

  // Check if user is eligible for welcome bonus
  async isEligibleForWelcomeBonus(address: string): Promise<boolean> {
    try {
      const user = await db.getUserProfile(address)
      return !user || !user.welcome_bonus_claimed
    } catch (error) {
      console.error("Error checking welcome bonus eligibility:", error)
      return false
    }
  }

  // Distribute welcome bonus
  async distributeWelcomeBonus(address: string, provider: ethers.BrowserProvider): Promise<boolean> {
    try {
      const isEligible = await this.isEligibleForWelcomeBonus(address)
      if (!isEligible) {
        return false
      }

      // In a real implementation, this would interact with the smart contract
      // For demo purposes, we'll simulate the distribution
      await this.simulateTokenDistribution(address, this.WELCOME_BONUS)

      // Update user profile
      await db.createOrUpdateUserProfile({
        wallet_address: address,
        welcome_bonus_claimed: true,
        vault_balance: 20,
        last_login: new Date().toISOString(),
        total_nfts_created: 0,
        total_shares_owned: 0,
        total_volume_traded: 0,
      })

      // Record transaction
      await db.recordTransaction({
        transaction_hash: `welcome_${address}_${Date.now()}`,
        from_address: "0x0000000000000000000000000000000000000000",
        to_address: address,
        token_id: 0,
        shares: 0,
        price_per_share: 0,
        total_amount: 20,
        transaction_type: "welcome_bonus",
        block_number: 0,
        gas_used: 0,
        gas_price: 0,
      })

      // Clear cache
      await cache.clearCache(`portfolio:${address}`)

      return true
    } catch (error) {
      console.error("Error distributing welcome bonus:", error)
      return false
    }
  }

  // Check daily bonus eligibility
  async isEligibleForDailyBonus(address: string): Promise<boolean> {
    try {
      const lastClaim = await cache.getUserSession(`daily_bonus:${address}`)
      if (!lastClaim) return true

      const lastClaimTime = new Date(lastClaim.timestamp)
      const now = new Date()
      const timeDiff = now.getTime() - lastClaimTime.getTime()
      const hoursDiff = timeDiff / (1000 * 3600)

      return hoursDiff >= 24
    } catch (error) {
      console.error("Error checking daily bonus eligibility:", error)
      return false
    }
  }

  // Distribute daily bonus
  async distributeDailyBonus(address: string): Promise<boolean> {
    try {
      const isEligible = await this.isEligibleForDailyBonus(address)
      if (!isEligible) {
        return false
      }

      await this.simulateTokenDistribution(address, this.DAILY_BONUS)

      // Update user balance
      const user = await db.getUserProfile(address)
      if (user) {
        await db.updateUserStats(address, {
          vault_balance: (user.vault_balance || 0) + 1,
        })
      }

      // Set daily bonus claim timestamp
      await cache.setUserSession(
        `daily_bonus:${address}`,
        {
          timestamp: new Date().toISOString(),
        },
        86400,
      ) // 24 hours

      return true
    } catch (error) {
      console.error("Error distributing daily bonus:", error)
      return false
    }
  }

  // Distribute referral bonus
  async distributeReferralBonus(referrer: string, referee: string): Promise<boolean> {
    try {
      // Check if referral is valid
      const referralKey = `referral:${referee}`
      const existingReferral = await cache.getUserSession(referralKey)

      if (existingReferral) {
        return false // Already referred
      }

      // Distribute bonus to referrer
      await this.simulateTokenDistribution(referrer, this.REFERRAL_BONUS)

      // Update referrer stats
      const referrerProfile = await db.getUserProfile(referrer)
      if (referrerProfile) {
        await db.updateUserStats(referrer, {
          vault_balance: (referrerProfile.vault_balance || 0) + 5,
          total_referrals: (referrerProfile.total_referrals || 0) + 1,
        })
      }

      // Mark referral as used
      await cache.setUserSession(referralKey, {
        referrer,
        timestamp: new Date().toISOString(),
      })

      return true
    } catch (error) {
      console.error("Error distributing referral bonus:", error)
      return false
    }
  }

  // Simulate token distribution (in production, this would call smart contract)
  private async simulateTokenDistribution(address: string, amount: bigint): Promise<void> {
    console.log(`Distributing ${ethers.formatEther(amount)} VAULT tokens to ${address}`)
    // In production, this would call the VaultCoin contract's mint function
  }

  // Get user's total VAULT balance
  async getUserVaultBalance(address: string): Promise<number> {
    try {
      const user = await db.getUserProfile(address)
      return user?.vault_balance || 0
    } catch (error) {
      console.error("Error getting user VAULT balance:", error)
      return 0
    }
  }
}

export const vaultDistribution = new VaultDistributionService()
