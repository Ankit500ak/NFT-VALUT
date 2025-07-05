"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamic from 'next/dynamic';
const WalletConnect = dynamic(() => import('@/components/wallet-connect'), { ssr: false })
import NFTMinter from "@/components/nft-minter"
import NFTGallery from "@/components/nft-gallery"
import UserDashboard from "@/components/user-dashboard"
import { useWeb3 } from "@/contexts/web3-context"
import { Wallet, ImageIcon, Share, TrendingUp, Users, Sparkles, Plus, Eye, BarChart3 } from "lucide-react"

export default function HomePage() {
  const { provider, account, isConnected, connect, disconnect } = useWeb3()
  const [activeTab, setActiveTab] = useState("gallery")
  const [showMinter, setShowMinter] = useState(false)

  const handleWalletConnect = (account: string, provider: any) => {
    // This is handled by the Web3Context
  }

  const handleWalletDisconnect = () => {
    disconnect()
  }

  const handleMintSuccess = (tokenId: number) => {
    setShowMinter(false)
    setActiveTab("my-nfts")
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Share className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              NFT
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Vault</span>
              Chain
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Create, fractionalize, and trade NFTs with built-in vault tokens. Own shares of valuable digital assets
              and participate in a new economy of fractional ownership.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-6 h-6 text-blue-400" />
                  </div>
                  <CardTitle className="text-white">Create NFTs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Mint your digital artwork as NFTs with automatic fractionalization into vault tokens
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Share className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white">Fractional Ownership</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Own shares of valuable NFTs through vault tokens, making expensive art accessible to everyone
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                  </div>
                  <CardTitle className="text-white">Trade & Earn</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm">
                    Buy and sell vault tokens on the marketplace, earning from price appreciation and royalties
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="max-w-md mx-auto">
            <WalletConnect
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
              isConnected={isConnected}
              account={account}
            />
          </div>

          {/* Features */}
          <div className="mt-16 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Why Choose NFTVaultChain?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">MetaMask Integration</h3>
                <p className="text-gray-400 text-sm">
                  Seamless wallet connection with MetaMask for secure transactions
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Automatic Fractionalization</h3>
                <p className="text-gray-400 text-sm">
                  Every NFT automatically creates vault tokens for fractional ownership
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibent text-white mb-2">Community Driven</h3>
                <p className="text-gray-400 text-sm">
                  Join a community of creators and collectors in the fractional NFT space
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">IPFS Storage</h3>
                <p className="text-gray-400 text-sm">
                  Decentralized storage ensures your NFTs are permanently accessible
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showMinter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <NFTMinter onSuccess={handleMintSuccess} onClose={() => setShowMinter(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Share className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">NFTVaultChain</h1>
              <p className="text-gray-400">Fractional NFT Ownership Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="text-white border-white/20">
              <Wallet className="w-4 h-4 mr-2" />
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </Badge>

            <Button
              onClick={() => setShowMinter(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create NFT
            </Button>

            <Button
              variant="outline"
              onClick={disconnect}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent"
            >
              Disconnect
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="gallery" className="data-[state=active]:bg-white/10">
              <Eye className="w-4 h-4 mr-2" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="my-nfts" className="data-[state=active]:bg-white/10">
              <ImageIcon className="w-4 h-4 mr-2" />
              My NFTs
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white/10">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery">
            <NFTGallery />
          </TabsContent>

          <TabsContent value="my-nfts">
            <NFTGallery showMyNFTs={true} />
          </TabsContent>

          <TabsContent value="dashboard">
            <UserDashboard provider={provider} account={account!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
