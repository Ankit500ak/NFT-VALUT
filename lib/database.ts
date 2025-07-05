import { supabase } from "./supabase"
import type { NFTRecord, UserProfile, Transaction, ShareHolding } from "./supabase"

export class DatabaseService {
  private supabase = supabase

  // NFT Operations
  async createNFT(nftData: Omit<NFTRecord, "id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase.from("nfts").insert(nftData).select().single()

    if (error) throw error
    return data
  }

  async getNFT(tokenId: number, contractAddress: string) {
    const { data, error } = await this.supabase
      .from("nfts")
      .select("*")
      .eq("token_id", tokenId)
      .eq("contract_address", contractAddress)
      .single()

    if (error) throw error
    return data
  }

  async getAllNFTs(limit = 50, offset = 0) {
    const { data, error } = await this.supabase
      .from("nfts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data
  }

  async getNFTsByCreator(creatorAddress: string) {
    const { data, error } = await this.supabase
      .from("nfts")
      .select("*")
      .eq("creator_address", creatorAddress)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  async updateNFTShares(tokenId: number, contractAddress: string, availableShares: number) {
    const { data, error } = await this.supabase
      .from("nfts")
      .update({
        available_shares: availableShares,
        updated_at: new Date().toISOString(),
      })
      .eq("token_id", tokenId)
      .eq("contract_address", contractAddress)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // User Profile Operations
  async createOrUpdateUserProfile(profileData: Omit<UserProfile, "id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase
      .from("user_profiles")
      .upsert(profileData, { onConflict: "wallet_address" })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserProfile(walletAddress: string) {
    const { data, error } = await this.supabase
      .from("user_profiles")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data
  }

  async updateUserStats(walletAddress: string, stats: Partial<UserProfile>) {
    const { data, error } = await this.supabase
      .from("user_profiles")
      .update({
        ...stats,
        updated_at: new Date().toISOString(),
      })
      .eq("wallet_address", walletAddress)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Transaction Operations
  async recordTransaction(transactionData: Omit<Transaction, "id" | "created_at">) {
    const { data, error } = await this.supabase
      .from("transactions")
      .insert({
        ...transactionData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getTransactionHistory(userAddress: string, limit = 50) {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .or(`from_address.eq.${userAddress},to_address.eq.${userAddress}`)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  async getNFTTransactionHistory(tokenId: number) {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("*")
      .eq("token_id", tokenId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  // Share Holdings Operations
  async updateShareHolding(holdingData: Omit<ShareHolding, "id">) {
    const { data, error } = await this.supabase
      .from("share_holdings")
      .upsert(holdingData, {
        onConflict: "user_address,token_id",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserShareHoldings(userAddress: string) {
    const { data, error } = await this.supabase
      .from("share_holdings")
      .select(`
        *,
        nfts (
          title,
          description,
          ipfs_hash,
          creator_address
        )
      `)
      .eq("user_address", userAddress)
      .gt("shares", 0)

    if (error) throw error
    return data
  }

  async getNFTShareHolders(tokenId: number) {
    const { data, error } = await this.supabase
      .from("share_holdings")
      .select(`
        *,
        user_profiles (
          username,
          avatar_url
        )
      `)
      .eq("token_id", tokenId)
      .gt("shares", 0)
      .order("shares", { ascending: false })

    if (error) throw error
    return data
  }

  // Analytics Operations
  async getPlatformStats() {
    const [nftCount, userCount, transactionCount, totalVolume] = await Promise.all([
      this.supabase.from("nfts").select("id", { count: "exact", head: true }),
      this.supabase.from("user_profiles").select("id", { count: "exact", head: true }),
      this.supabase.from("transactions").select("id", { count: "exact", head: true }),
      this.supabase
        .from("transactions")
        .select("total_amount")
        .then(({ data }) => data?.reduce((sum, tx) => sum + tx.total_amount, 0) || 0),
    ])

    return {
      totalNFTs: nftCount.count || 0,
      totalUsers: userCount.count || 0,
      totalTransactions: transactionCount.count || 0,
      totalVolume: totalVolume,
    }
  }

  async getTrendingNFTs(limit = 10) {
    const { data, error } = await this.supabase
      .from("nfts")
      .select(`
        *,
        transactions!inner (
          total_amount,
          created_at
        )
      `)
      .gte("transactions.created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("transactions.total_amount", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }
}

export const db = new DatabaseService()
