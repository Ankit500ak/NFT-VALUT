export const CONTRACT_ADDRESSES = {
  // All contract addresses should be set via environment variables or deployment output
  NFT_CONTRACT: process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS,
  // Add other contract addresses as needed, e.g.:
  // VAULT_CONTRACT: process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS,
  // TOKEN_CONTRACT: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS,
} as const;

export type NetworkName = keyof typeof CONTRACT_ADDRESSES;
