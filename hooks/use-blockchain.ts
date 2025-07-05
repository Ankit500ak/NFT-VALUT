"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { getBlockchainProvider, initializeBlockchainProvider, type ContractAddresses } from "@/lib/blockchain-provider"
import { useToast } from "@/hooks/use-toast"

const CONTRACT_ADDRESSES: ContractAddresses = {
  vaultCoin: process.env.NEXT_PUBLIC_VAULT_COIN_ADDRESS,
  nftVault: process.env.NEXT_PUBLIC_NFT_VAULT_ADDRESS,
  auctionSystem: process.env.NEXT_PUBLIC_AUCTION_SYSTEM_ADDRESS,
  governance: process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS,
  // All addresses must be set in .env or deployment output
}

export interface UseBlockchainReturn {
  provider: ethers.BrowserProvider | null
  signer: ethers.Signer | null
  account: string
  chainId: number | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  vaultBalance: string
  votingPower: number
  connect: () => Promise<void>
  disconnect: () => void
  switchNetwork: (targetChainId: number) => Promise<void>
  refreshData: () => Promise<void>
}

export function useBlockchain(): UseBlockchainReturn {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [account, setAccount] = useState("")
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [vaultBalance, setVaultBalance] = useState("0")
  const [votingPower, setVotingPower] = useState(0)
  const { toast } = useToast()

  const refreshData = useCallback(async () => {
    if (!account || !provider) return

    try {
      const blockchainProvider = getBlockchainProvider()

      const [balance, power] = await Promise.all([
        blockchainProvider.getVaultBalance(account),
        blockchainProvider.getVotingPower(account),
      ])

      setVaultBalance(balance)
      setVotingPower(power)
    } catch (error) {
      console.error("Error refreshing data:", error)
    }
  }, [account, provider])

  const connect = useCallback(async () => {
    if (typeof window.ethereum === "undefined") {
      setError("MetaMask is not installed")
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to use this application",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum)
      await browserProvider.send("eth_requestAccounts", [])

      const userSigner = await browserProvider.getSigner()
      const address = await userSigner.getAddress()
      const network = await browserProvider.getNetwork()

      // Initialize blockchain provider
      const blockchainProvider = initializeBlockchainProvider(browserProvider, CONTRACT_ADDRESSES)
      blockchainProvider.setSigner(userSigner)

      setProvider(browserProvider)
      setSigner(userSigner)
      setAccount(address)
      setChainId(Number(network.chainId))
      setIsConnected(true)

      // Setup event listeners
      blockchainProvider.setupEventListeners({
        onNFTMinted: (event) => {
          toast({
            title: "NFT Minted!",
            description: `NFT #${event.args.tokenId} has been minted`,
          })
          refreshData()
        },
        onSharesPurchased: (event) => {
          toast({
            title: "Shares Purchased!",
            description: `${event.args.shares} shares purchased for ${ethers.formatEther(event.args.totalPrice)} ETH`,
          })
          refreshData()
        },
        onAuctionCreated: (event) => {
          toast({
            title: "Auction Created!",
            description: `New auction created for NFT #${event.args.tokenId}`,
          })
        },
        onBidPlaced: (event) => {
          toast({
            title: "Bid Placed!",
            description: `New bid of ${ethers.formatEther(event.args.amount)} ETH placed`,
          })
        },
        onProposalCreated: (event) => {
          toast({
            title: "Proposal Created!",
            description: `New governance proposal: ${event.args.title}`,
          })
        },
        onVoteCast: (event) => {
          toast({
            title: "Vote Cast!",
            description: `Vote cast on proposal #${event.args.proposalId}`,
          })
        },
      })

      // Listen for account changes
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      })

      // Load initial data
      await refreshData()
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      setError(error.message || "Failed to connect wallet")
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, refreshData])

  const disconnect = useCallback(() => {
    try {
      const blockchainProvider = getBlockchainProvider()
      blockchainProvider.removeAllListeners()
    } catch (error) {
      // Provider might not be initialized
    }

    setProvider(null)
    setSigner(null)
    setAccount("")
    setChainId(null)
    setIsConnected(false)
    setVaultBalance("0")
    setVotingPower(0)
    setError(null)

    // Remove event listeners
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum.removeListener("chainChanged", handleChainChanged)
    }

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }, [toast])

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        throw new Error("Please add this network to MetaMask first")
      }
      throw error
    }
  }, [])

  const handleAccountsChanged = useCallback(
    (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else if (accounts[0] !== account) {
        setAccount(accounts[0])
        refreshData()
      }
    },
    [account, disconnect, refreshData],
  )

  const handleChainChanged = useCallback((chainId: string) => {
    setChainId(Number.parseInt(chainId, 16))
    window.location.reload()
  }, [])

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await browserProvider.listAccounts()

          if (accounts.length > 0) {
            const network = await browserProvider.getNetwork()
            const userSigner = await browserProvider.getSigner()

            // Initialize blockchain provider
            const blockchainProvider = initializeBlockchainProvider(browserProvider, CONTRACT_ADDRESSES)
            blockchainProvider.setSigner(userSigner)

            setProvider(browserProvider)
            setSigner(userSigner)
            setAccount(accounts[0].address)
            setChainId(Number(network.chainId))
            setIsConnected(true)

            // Add event listeners
            window.ethereum.on("accountsChanged", handleAccountsChanged)
            window.ethereum.on("chainChanged", handleChainChanged)

            // Load initial data
            await refreshData()
          }
        } catch (error) {
          console.error("Failed to check wallet connection:", error)
        }
      }
    }

    checkConnection()

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [handleAccountsChanged, handleChainChanged, refreshData])

  return {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isLoading,
    error,
    vaultBalance,
    votingPower,
    connect,
    disconnect,
    switchNetwork,
    refreshData,
  }
}
