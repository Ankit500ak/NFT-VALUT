"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, MessageCircle, TrendingUp, Shield, Lightbulb, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { aiService } from "@/lib/ai-service"

interface AIAssistantProps {
  userPortfolio?: any
  marketData?: any
}

export default function AIAssistant({ userPortfolio, marketData }: AIAssistantProps) {
  const [activeTab, setActiveTab] = useState("chat")
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [nftTitle, setNftTitle] = useState("")
  const [nftStyle, setNftStyle] = useState("")
  const [nftMood, setNftMood] = useState("")
  const [generatedDescription, setGeneratedDescription] = useState("")
  const [marketAnalysis, setMarketAnalysis] = useState("")
  const [investmentAdvice, setInvestmentAdvice] = useState("")
  const { toast } = useToast()

  const handleChat = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatInput("")
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      let assistantResponse = ""
      const stream = aiService.chatWithSupport(userMessage, { userPortfolio, marketData })

      // Add empty assistant message that we'll update
      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }])

      for await (const chunk of stream) {
        assistantResponse += chunk
        setChatMessages((prev) => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = assistantResponse
          return newMessages
        })
      }
    } catch (error) {
      toast({
        title: "Chat Error",
        description: "Failed to get response from AI assistant",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateDescription = async () => {
    if (!nftTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter an NFT title to generate description",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const description = await aiService.generateNFTDescription(nftTitle, nftStyle, nftMood)
      setGeneratedDescription(description)
      toast({
        title: "Description Generated",
        description: "AI has generated a compelling NFT description",
      })
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate NFT description",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const analyzeMarket = async () => {
    if (!marketData || marketData.length === 0) {
      toast({
        title: "No Market Data",
        description: "Market data is required for analysis",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const analysis = await aiService.analyzeNFTMarket(marketData)
      setMarketAnalysis(analysis)
      toast({
        title: "Analysis Complete",
        description: "Market analysis has been generated",
      })
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze market data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getInvestmentAdvice = async () => {
    if (!userPortfolio) {
      toast({
        title: "Portfolio Required",
        description: "Connect your wallet to get personalized investment advice",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const advice = await aiService.getInvestmentAdvice(userPortfolio, marketData)
      setInvestmentAdvice(advice)
      toast({
        title: "Advice Generated",
        description: "Personalized investment advice is ready",
      })
    } catch (error) {
      toast({
        title: "Advice Failed",
        description: "Failed to generate investment advice",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <Bot className="w-8 h-8 mr-3 text-blue-600" />
          AI Assistant
        </h2>
        <p className="text-gray-600">Get AI-powered insights, descriptions, and market analysis</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat Support
          </TabsTrigger>
          <TabsTrigger value="description" className="flex items-center">
            <Lightbulb className="w-4 h-4 mr-2" />
            NFT Description
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center">
            <TrendingUp className="w-4 h-4 mr-2" />
            Market Analysis
          </TabsTrigger>
          <TabsTrigger value="investment" className="flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Investment Advice
          </TabsTrigger>
        </TabsList>

        {/* Chat Support */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat with AI Support</CardTitle>
              <CardDescription>Ask questions about the platform, trading, or get help with any issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Start a conversation with the AI assistant</p>
                    <p className="text-sm">Ask about NFT trading, platform features, or get help</p>
                  </div>
                ) : (
                  chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me anything about NFTVaultChain..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleChat()}
                  disabled={isLoading}
                />
                <Button onClick={handleChat} disabled={isLoading || !chatInput.trim()}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NFT Description Generator */}
        <TabsContent value="description">
          <Card>
            <CardHeader>
              <CardTitle>AI NFT Description Generator</CardTitle>
              <CardDescription>Generate compelling descriptions for your NFTs using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">NFT Title *</label>
                    <Input
                      placeholder="Enter your NFT title"
                      value={nftTitle}
                      onChange={(e) => setNftTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Style (Optional)</label>
                    <Input
                      placeholder="e.g., Abstract, Realistic, Digital Art"
                      value={nftStyle}
                      onChange={(e) => setNftStyle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mood (Optional)</label>
                    <Input
                      placeholder="e.g., Mysterious, Vibrant, Peaceful"
                      value={nftMood}
                      onChange={(e) => setNftMood(e.target.value)}
                    />
                  </div>
                  <Button onClick={generateDescription} disabled={isLoading || !nftTitle.trim()} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Generate Description
                      </>
                    )}
                  </Button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Generated Description</label>
                  <Textarea
                    placeholder="AI-generated description will appear here..."
                    value={generatedDescription}
                    onChange={(e) => setGeneratedDescription(e.target.value)}
                    rows={10}
                    className="resize-none"
                  />
                  {generatedDescription && (
                    <div className="mt-2 flex justify-between items-center">
                      <Badge variant="secondary">{generatedDescription.length} characters</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(generatedDescription)}
                      >
                        Copy
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Analysis */}
        <TabsContent value="market">
          <Card>
            <CardHeader>
              <CardTitle>AI Market Analysis</CardTitle>
              <CardDescription>Get AI-powered insights on NFT market trends and opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={analyzeMarket} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Market...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analyze Current Market
                  </>
                )}
              </Button>

              {marketAnalysis && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Market Analysis Report</h4>
                  <div className="whitespace-pre-wrap text-sm">{marketAnalysis}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investment Advice */}
        <TabsContent value="investment">
          <Card>
            <CardHeader>
              <CardTitle>AI Investment Advisor</CardTitle>
              <CardDescription>
                Get personalized investment advice based on your portfolio and market conditions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={getInvestmentAdvice} disabled={isLoading || !userPortfolio} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Advice...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Get Investment Advice
                  </>
                )}
              </Button>

              {!userPortfolio && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Connect your wallet to get personalized investment advice based on your portfolio.
                  </p>
                </div>
              )}

              {investmentAdvice && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Investment Recommendations</h4>
                  <div className="whitespace-pre-wrap text-sm">{investmentAdvice}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
