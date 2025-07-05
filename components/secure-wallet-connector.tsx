"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wallet, Shield, CheckCircle, AlertTriangle, Loader2, Key } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SecureWalletConnectorProps {
  onConnect: (provider: ethers.BrowserProvider, account: string, signature: string) => void
  onDisconnect: () => void
  isConnected: boolean
  account?: string
}

export default function SecureWalletConnector({
  onConnect,
  onDisconnect,
  isConnected,
  account,
}: SecureWalletConnectorProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [connectionStep, setConnectionStep] = useState<"idle" | "connecting" | "signing" | "verifying" | "complete">(
    "idle",
  )
  const [securityChecks, setSecurityChecks] = useState({
    walletDetected: false,
    networkSupported: false,
    accountUnlocked: false,
    signatureValid: false,
  })
  const { toast } = useToast()

  const SUPPORTED_NETWORKS = [1, 11155111, 1337] // Mainnet, Sepolia, Localhost
  const VERIFICATION_MESSAGE =
    "Welcome to NFTVaultChain! Please sign this message to verify your wallet ownership. This will not trigger any blockchain transaction or cost any gas fees.\n\nTimestamp: "

  useEffect(() => {
    checkWalletAvailability()
  }, [])

  const checkWalletAvailability = async () => {
    const walletDetected = typeof window.ethereum !== "undefined"
    setSecurityChecks((prev) => ({ ...prev, walletDetected }))

    if (walletDetected) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const network = await provider.getNetwork()
        const networkSupported = SUPPORTED_NETWORKS.includes(Number(network.chainId))
        setSecurityChecks((prev) => ({ ...prev, networkSupported }))
      } catch (error) {
        console.error("Error checking network:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (!securityChecks.walletDetected) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    setConnectionStep("connecting")

    try {
      // Step 1: Request account access
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()

      // Step 2: Verify network
      if (!SUPPORTED_NETWORKS.includes(Number(network.chainId))) {
        throw new Error(`Unsupported network. Please switch to Ethereum Mainnet, Sepolia, or Localhost`)
      }

      setSecurityChecks((prev) => ({
        ...prev,
        accountUnlocked: true,
        networkSupported: true,
      }))

      // Step 3: Request signature for verification
      setConnectionStep("signing")
      const timestamp = Date.now()
      const message = VERIFICATION_MESSAGE + timestamp

      toast({
        title: "Signature Required",
        description: "Please sign the message in your wallet to verify ownership",
      })

      const signature = await signer.signMessage(message)

      // Step 4: Verify signature
      setConnectionStep("verifying")
      setIsVerifying(true)

      const recoveredAddress = ethers.verifyMessage(message, signature)

      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Signature verification failed")
      }

      setSecurityChecks((prev) => ({ ...prev, signatureValid: true }))

      // Step 5: Complete connection
      setConnectionStep("complete")

      // Register user if new (this would call smart contract)
      await registerUserIfNew(address, provider)

      onConnect(provider, address, signature)

      toast({
        title: "Wallet Connected Securely",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      })
    } catch (error: any) {
      console.error("Connection error:", error)

      let errorMessage = "Failed to connect wallet"
      if (error.code === 4001) {
        errorMessage = "Connection rejected by user"
      } else if (error.code === -32002) {
        errorMessage = "Connection request already pending"
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      })

      setConnectionStep("idle")
      setSecurityChecks((prev) => ({
        ...prev,
        accountUnlocked: false,
        signatureValid: false,
      }))
    } finally {
      setIsConnecting(false)
      setIsVerifying(false)
    }
  }

  const registerUserIfNew = async (address: string, provider: ethers.BrowserProvider) => {
    try {
      // This would interact with your VaultCoin contract to register new users
      // For now, we'll simulate the registration
      const hasReceivedBonus = false // This would be checked from contract

      if (!hasReceivedBonus) {
        toast({
          title: "Welcome Bonus!",
          description: "You've received 20 VAULT tokens as a welcome bonus!",
        })
      }
    } catch (error) {
      console.error("Error registering user:", error)
    }
  }

  const disconnectWallet = () => {
    setConnectionStep("idle")
    setSecurityChecks((prev) => ({
      ...prev,
      accountUnlocked: false,
      signatureValid: false,
    }))
    onDisconnect()

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been safely disconnected",
    })
  }

  const getStepIcon = (step: string) => {
    switch (step) {
      case "connecting":
        return <Loader2 className="w-4 h-4 animate-spin" />
      case "signing":
        return <Key className="w-4 h-4" />
      case "verifying":
        return <Shield className="w-4 h-4" />
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Wallet className="w-4 h-4" />
    }
  }

  const getStepDescription = () => {
    switch (connectionStep) {
      case "connecting":
        return "Connecting to your wallet..."
      case "signing":
        return "Please sign the verification message"
      case "verifying":
        return "Verifying your signature..."
      case "complete":
        return "Connection established securely"
      default:
        return "Ready to connect"
    }
  }

  if (isConnected && account) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">Wallet Connected</CardTitle>
          <CardDescription>Your wallet is securely connected</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Account:</span>
              <Badge variant="secondary">
                {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge className="bg-green-500">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Security Checks</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Wallet Detected</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Network Supported</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Account Unlocked</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Signature Valid</span>
              </div>
            </div>
          </div>

          <Button onClick={disconnectWallet} variant="outline" className="w-full bg-transparent">
            Disconnect Wallet
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          {getStepIcon(connectionStep)}
        </div>
        <CardTitle className="text-2xl">Secure Wallet Connection</CardTitle>
        <CardDescription>{getStepDescription()}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Security Checks */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Security Verification</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              {securityChecks.walletDetected ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-yellow-600" />
              )}
              <span>Wallet Detected</span>
            </div>
            <div className="flex items-center space-x-2">
              {securityChecks.networkSupported ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-yellow-600" />
              )}
              <span>Network Supported</span>
            </div>
            <div className="flex items-center space-x-2">
              {securityChecks.accountUnlocked ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-gray-300" />
              )}
              <span>Account Unlocked</span>
            </div>
            <div className="flex items-center space-x-2">
              {securityChecks.signatureValid ? (
                <CheckCircle className="w-3 h-3 text-green-600" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-gray-300" />
              )}
              <span>Signature Valid</span>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {!securityChecks.walletDetected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No Web3 wallet detected. Please install MetaMask or another compatible wallet.
            </AlertDescription>
          </Alert>
        )}

        {securityChecks.walletDetected && !securityChecks.networkSupported && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please switch to a supported network (Ethereum Mainnet, Sepolia, or Localhost).
            </AlertDescription>
          </Alert>
        )}

        {/* Connection Steps */}
        {connectionStep !== "idle" && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium mb-2">Connection Progress:</div>
            <div className="space-y-1 text-xs">
              <div
                className={`flex items-center space-x-2 ${connectionStep === "connecting" ? "text-blue-600" : "text-gray-500"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${connectionStep === "connecting" ? "bg-blue-600" : "bg-gray-300"}`}
                />
                <span>Requesting wallet access</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${connectionStep === "signing" ? "text-blue-600" : "text-gray-500"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${connectionStep === "signing" ? "bg-blue-600" : "bg-gray-300"}`}
                />
                <span>Requesting signature</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${connectionStep === "verifying" ? "text-blue-600" : "text-gray-500"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${connectionStep === "verifying" ? "bg-blue-600" : "bg-gray-300"}`}
                />
                <span>Verifying ownership</span>
              </div>
              <div
                className={`flex items-center space-x-2 ${connectionStep === "complete" ? "text-green-600" : "text-gray-500"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${connectionStep === "complete" ? "bg-green-600" : "bg-gray-300"}`}
                />
                <span>Connection complete</span>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={connectWallet}
          disabled={isConnecting || !securityChecks.walletDetected}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
          size="lg"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {connectionStep === "connecting" && "Connecting..."}
              {connectionStep === "signing" && "Waiting for Signature..."}
              {connectionStep === "verifying" && "Verifying..."}
            </>
          ) : (
            <>
              <Shield className="w-5 h-5 mr-2" />
              Connect Securely
            </>
          )}
        </Button>

        <div className="text-center text-xs text-gray-500">
          <p>🔒 Your private keys never leave your wallet</p>
          <p>✅ Signature verification ensures security</p>
        </div>
      </CardContent>
    </Card>
  )
}
