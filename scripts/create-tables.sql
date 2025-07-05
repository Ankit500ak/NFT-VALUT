-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table
CREATE TABLE user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    username TEXT,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_nfts_created INTEGER DEFAULT 0,
    total_shares_owned INTEGER DEFAULT 0,
    total_volume_traded DECIMAL(20, 8) DEFAULT 0
);

-- NFTs Table
CREATE TABLE nfts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    creator_address TEXT NOT NULL,
    ipfs_hash TEXT NOT NULL,
    total_shares INTEGER NOT NULL,
    available_shares INTEGER NOT NULL,
    price_per_share DECIMAL(20, 8) NOT NULL,
    royalty_percentage INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contract_address TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    UNIQUE(token_id, contract_address)
);

-- Transactions Table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    transaction_hash TEXT UNIQUE NOT NULL,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    shares INTEGER NOT NULL,
    price_per_share DECIMAL(20, 8) NOT NULL,
    total_amount DECIMAL(20, 8) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('mint', 'buy', 'sell', 'transfer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    block_number BIGINT,
    gas_used BIGINT,
    gas_price DECIMAL(20, 8)
);

-- Share Holdings Table
CREATE TABLE share_holdings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_address TEXT NOT NULL,
    token_id INTEGER NOT NULL,
    shares INTEGER NOT NULL,
    purchase_price DECIMAL(20, 8) NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_value DECIMAL(20, 8) DEFAULT 0,
    profit_loss DECIMAL(20, 8) DEFAULT 0,
    UNIQUE(user_address, token_id)
);

-- Marketplace Listings Table
CREATE TABLE marketplace_listings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id INTEGER NOT NULL,
    token_id INTEGER NOT NULL,
    seller_address TEXT NOT NULL,
    shares INTEGER NOT NULL,
    price_per_share DECIMAL(20, 8) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    contract_address TEXT NOT NULL
);

-- Price History Table
CREATE TABLE price_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token_id INTEGER NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    volume INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contract_address TEXT NOT NULL
);

-- Indexes for better performance
CREATE INDEX idx_nfts_creator ON nfts(creator_address);
CREATE INDEX idx_nfts_token_contract ON nfts(token_id, contract_address);
CREATE INDEX idx_transactions_from ON transactions(from_address);
CREATE INDEX idx_transactions_to ON transactions(to_address);
CREATE INDEX idx_transactions_token ON transactions(token_id);
CREATE INDEX idx_share_holdings_user ON share_holdings(user_address);
CREATE INDEX idx_share_holdings_token ON share_holdings(token_id);
CREATE INDEX idx_marketplace_active ON marketplace_listings(active) WHERE active = TRUE;
CREATE INDEX idx_price_history_token ON price_history(token_id, timestamp);

-- Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (wallet_address = current_setting('app.current_user_address', true));

CREATE POLICY "Anyone can view NFTs" ON nfts FOR SELECT USING (true);
CREATE POLICY "Creators can update own NFTs" ON nfts FOR UPDATE USING (creator_address = current_setting('app.current_user_address', true));

CREATE POLICY "Anyone can view transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Users can view own holdings" ON share_holdings FOR SELECT USING (user_address = current_setting('app.current_user_address', true));

CREATE POLICY "Anyone can view active listings" ON marketplace_listings FOR SELECT USING (active = true);
CREATE POLICY "Anyone can view price history" ON price_history FOR SELECT USING (true);
