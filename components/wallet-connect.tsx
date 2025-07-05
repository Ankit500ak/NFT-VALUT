"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, CheckCircle, AlertCircle, ExternalLink, Copy, LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletConnectProps {
  onConnect: (account: string, provider: any) => void
  onDisconnect: () => void
  isConnected: boolean
  account: string | null
}

export default function WalletConnect({ onConnect, onDisconnect, isConnected, account }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const { toast } = useToast()

  const SUPPORTED_NETWORKS = {
    sepolia: {
      chainId: "0xaa36a7",
      chainName: "Sepolia Test Network",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://sepolia.infura.io/v3/"],
      blockExplorerUrls: ["https://sepolia.etherscan.io/"],
    },
    arbitrumSepolia: {
      chainId: "0x66eee",
      chainName: "Arbitrum Sepolia",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      rpcUrls: ["https://sepolia-rollup.arbitrum.io/rpc"],
      blockExplorerUrls: ["https://sepolia.arbiscan.io/"],
    },
  }

  useEffect(() => {
    checkConnection()
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [])

  useEffect(() => {
    if (isConnected && account) {
      loadBalance()
    }
  }, [isConnected, account])

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          const provider = window.ethereum
          onConnect(accounts[0], provider)
          await checkNetwork()
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const loadBalance = async () => {
    if (typeof window.ethereum !== "undefined" && account) {
      try {
        const balance = await window.ethereum.request({
          method: "eth_getBalance",
          params: [account, "latest"],
        })
        const balanceInEth = Number.parseInt(balance, 16) / Math.pow(10, 18)
        setBalance(balanceInEth.toFixed(4))
      } catch (error) {
        console.error("Error loading balance:", error)
      }
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      onDisconnect()
      setBalance("0")
    } else {
      onConnect(accounts[0], window.ethereum)
    }
  }

  const handleChainChanged = () => {
    window.location.reload()
  }

  const checkNetwork = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        const supportedChainIds = Object.values(SUPPORTED_NETWORKS).map((network) => network.chainId)

        if (!supportedChainIds.includes(chainId)) {
          setNetworkError("Please switch to Sepolia or Arbitrum Sepolia network")
          return false
        }

        setNetworkError(null)
        return true
      } catch (error) {
        console.error("Error checking network:", error)
        return false
      }
    }
    return false
  }

  const switchNetwork = async (networkKey: keyof typeof SUPPORTED_NETWORKS) => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const network = SUPPORTED_NETWORKS[networkKey]
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: network.chainId }],
        })
        setNetworkError(null)
        toast({
          title: "Network Switched",
          description: `Successfully switched to ${network.chainName}`,
        })
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            const network = SUPPORTED_NETWORKS[networkKey]
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [network],
            })
            setNetworkError(null)
            toast({
              title: "Network Added",
              description: `Successfully added and switched to ${network.chainName}`,
            })
          } catch (addError) {
            console.error("Error adding network:", addError)
            toast({
              title: "Network Error",
              description: "Failed to add network",
              variant: "destructive",
            })
          }
        } else {
          console.error("Error switching network:", switchError)
          toast({
            title: "Network Error",
            description: "Failed to switch network",
            variant: "destructive",
          })
        }
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to continue",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        const networkValid = await checkNetwork()
        if (networkValid) {
          onConnect(accounts[0], window.ethereum)
          toast({
            title: "Wallet Connected",
            description: "Successfully connected to MetaMask",
          })
        }
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      let errorMessage = "Failed to connect wallet"

      if (error.code === 4001) {
        errorMessage = "Connection rejected by user"
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending"
      }

      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    onDisconnect()
    setBalance("0")
    setNetworkError(null)
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from MetaMask",
    })
  }

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openInExplorer = () => {
    if (account) {
      window.open(`https://sepolia.etherscan.io/address/${account}`, "_blank")
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-md mx-auto">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Connect Your Wallet</CardTitle>
            <CardDescription className="text-gray-400">
              Connect your MetaMask wallet to start creating and trading fractional NFTs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {typeof window !== "undefined" && typeof window.ethereum === "undefined" && (
              <Alert className="border-orange-500/20 bg-orange-500/10">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-200">
                  MetaMask is not installed. Please install MetaMask extension to continue.
                  <a
                    href="https://metamask.io/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-orange-400 hover:text-orange-300 underline inline-flex items-center"
                  >
                    Download MetaMask
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </AlertDescription>
              </Alert>
            )}

            {networkError && (
              <Alert className="border-red-500/20 bg-red-500/10">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-200">{networkError}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={connectWallet}
              disabled={isConnecting || (typeof window !== 'undefined' && typeof window.ethereum === "undefined")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect MetaMask
                </>
              )}
            </Button>

            {networkError && (
              <div className="space-y-2">
                <p className="text-sm text-gray-400 text-center">Switch to a supported network:</p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchNetwork("sepolia")}
                    className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    Sepolia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchNetwork("arbitrumSepolia")}
                    className="flex-1 border-white/20 text-white hover:bg-white/10 bg-transparent"
                  >
                    Arbitrum Sepolia
                  </Button>
                </div>
              </div>
            )}

            <div className="text-center text-sm text-gray-400">
              <p>Supported Networks:</p>
              <p>• Ethereum Sepolia Testnet</p>
              <p>• Arbitrum Sepolia Testnet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <CardTitle className="text-white">Wallet Connected</CardTitle>
              <CardDescription className="text-gray-400">Ready to interact with NFTs</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-400/20">
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Address:</span>
            <div className="flex items-center space-x-2">
              <code className="text-white bg-white/10 px-2 py-1 rounded text-sm">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </code>
              <Button variant="ghost" size="sm" onClick={copyAddress} className="text-gray-400 hover:text-white">
                <Copy className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={openInExplorer} className="text-gray-400 hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Balance:</span>
            <span className="text-white font-medium">{balance} ETH</span>
          </div>
        </div>

        {networkError && (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-200">{networkError}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={disconnectWallet}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect Wallet
        </Button>
      </CardContent>
    </Card>
  )
}
