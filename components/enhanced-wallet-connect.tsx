"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Wallet, Shield, Gift, Users, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cryptoHandshake } from "@/lib/crypto-utils"
import { vaultDistribution } from "@/lib/vault-distribution"

interface EnhancedWalletConnectProps {
  onConnect: (provider: ethers.BrowserProvider, account: string, sessionToken: string) => void
}

export default function EnhancedWalletConnect({ onConnect }: EnhancedWalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [challenge, setChallenge] = useState("")
  const [account, setAccount] = useState("")
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null)
  const [referralCode, setReferralCode] = useState("")
  const [showReferral, setShowReferral] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search)
    const ref = urlParams.get("ref")
    if (ref) {
      setReferralCode(ref)
      setShowReferral(true)
    }
  }, [])

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask Required",
        description: "Please install MetaMask to use this application",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      setProvider(provider)
      setAccount(address)

      // Generate challenge for verification
      const challengeString = cryptoHandshake.generateChallenge(address)
      setChallenge(challengeString)

      toast({
        title: "Wallet Connected",
        description: "Please sign the message to verify ownership",
      })

      // Automatically trigger verification
      await verifyOwnership(provider, address, challengeString)
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const verifyOwnership = async (provider: ethers.BrowserProvider, address: string, challengeString: string) => {
    setIsVerifying(true)

    try {
      const signer = await provider.getSigner()
      const message = `NFTVaultChain Authentication\nChallenge: ${challengeString}\nTimestamp: ${Date.now()}`

      // Request signature
      const signature = await signer.signMessage(message)

      // Verify signature
      const isValid = await cryptoHandshake.verifyChallenge(address, signature, challengeString)

      if (!isValid) {
        throw new Error("Invalid signature")
      }

      // Generate session token
      const sessionToken = cryptoHandshake.generateSessionToken(address)

      // Check and distribute welcome bonus
      const welcomeBonusDistributed = await vaultDistribution.distributeWelcomeBonus(address, provider)

      if (welcomeBonusDistributed) {
        toast({
          title: "Welcome Bonus! 🎉",
          description: "You've received 20 VAULT tokens as a welcome bonus!",
        })
      }

      // Handle referral bonus
      if (referralCode && referralCode !== address) {
        const referralBonusDistributed = await vaultDistribution.distributeReferralBonus(referralCode, address)
        if (referralBonusDistributed) {
          toast({
            title: "Referral Bonus! 🎁",
            description: "Your referrer received 5 VAULT tokens!",
          })
        }
      }

      // Check daily bonus eligibility
      const dailyBonusEligible = await vaultDistribution.isEligibleForDailyBonus(address)
      if (dailyBonusEligible) {
        const dailyBonusDistributed = await vaultDistribution.distributeDailyBonus(address)
        if (dailyBonusDistributed) {
          toast({
            title: "Daily Bonus! ⭐",
            description: "You've received 1 VAULT token as daily bonus!",
          })
        }
      }

      toast({
        title: "Verification Successful",
        description: "Your wallet has been verified and authenticated",
      })

      onConnect(provider, address, sessionToken)
    } catch (error: any) {
      console.error("Error verifying ownership:", error)
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify wallet ownership",
        variant: "destructive",
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const generateReferralLink = () => {
    if (!account) return ""
    const baseUrl = window.location.origin
    return `${baseUrl}?ref=${account}`
  }

  const copyReferralLink = () => {
    const link = generateReferralLink()
    navigator.clipboard.writeText(link)
    toast({
      title: "Referral Link Copied",
      description: "Share this link to earn 5 VAULT tokens per referral",
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Secure Wallet Connection</CardTitle>
          <CardDescription>
            Connect your wallet with cryptographic verification and receive welcome bonuses
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security Features */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
              <div className="text-sm">
                <div className="font-medium text-green-800">Crypto Handshake</div>
                <div className="text-green-600">Signature Verification</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <Gift className="w-5 h-5 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">Welcome Bonus</div>
                <div className="text-blue-600">20 VAULT Tokens</div>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
              <div className="text-sm">
                <div className="font-medium text-purple-800">Referral System</div>
                <div className="text-purple-600">5 VAULT per Referral</div>
              </div>
            </div>
          </div>

          {/* Referral Input */}
          {showReferral && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-800">Referral Code Detected</span>
              </div>
              <Input
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Referrer's wallet address"
                className="bg-white"
              />
              <p className="text-xs text-yellow-700 mt-1">Your referrer will receive 5 VAULT tokens when you join!</p>
            </div>
          )}

          {/* Connection Status */}
          {account && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Connected Account:</span>
                <Badge variant="outline">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </Badge>
              </div>

              {challenge && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  {isVerifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-blue-800">Verifying signature...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800">Ready for verification</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Connect Button */}
          {!account ? (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5 mr-2" />
                  Connect & Verify Wallet
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={() => verifyOwnership(provider!, account, challenge)}
                disabled={isVerifying || !challenge}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600"
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Verify Ownership
                  </>
                )}
              </Button>

              <Button onClick={copyReferralLink} variant="outline" className="w-full bg-transparent" size="sm">
                <Users className="w-4 h-4 mr-2" />
                Copy Referral Link
              </Button>
            </div>
          )}

          {/* Benefits */}
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              🎁 <strong>New User Benefits:</strong>
            </p>
            <div className="flex justify-center space-x-4">
              <span>• 20 VAULT Welcome Bonus</span>
              <span>• 1 VAULT Daily Bonus</span>
              <span>• 5 VAULT Referral Rewards</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>Cryptographic Handshake:</strong> Your wallet ownership is verified through digital signature
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>Session Security:</strong> Secure session tokens prevent unauthorized access
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>No Private Keys:</strong> We never ask for or store your private keys
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <div>
                <strong>Automatic Bonuses:</strong> Welcome and daily bonuses are distributed automatically
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
