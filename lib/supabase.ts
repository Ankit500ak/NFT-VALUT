import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for API routes
export const createServerSupabaseClient = () => {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Database types
export interface NFTRecord {
  id: string
  token_id: number
  title: string
  description: string
  creator_address: string
  ipfs_hash: string
  total_shares: number
  available_shares: number
  price_per_share: number
  royalty_percentage: number
  created_at: string
  updated_at: string
  contract_address: string
  chain_id: number
}

export interface UserProfile {
  id: string
  wallet_address: string
  username?: string
  email?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
  total_nfts_created: number
  total_shares_owned: number
  total_volume_traded: number
}

export interface Transaction {
  id: string
  transaction_hash: string
  from_address: string
  to_address: string
  token_id: number
  shares: number
  price_per_share: number
  total_amount: number
  transaction_type: "mint" | "buy" | "sell" | "transfer"
  created_at: string
  block_number: number
  gas_used: number
  gas_price: number
}

export interface ShareHolding {
  id: string
  user_address: string
  token_id: number
  shares: number
  purchase_price: number
  purchase_date: string
  current_value: number
  profit_loss: number
}
