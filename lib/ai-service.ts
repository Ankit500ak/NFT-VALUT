import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"

export class AIService {
  // NFT Description Generator
  async generateNFTDescription(title: string, style?: string, mood?: string) {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Generate a compelling NFT description for an artwork titled "${title}". 
        ${style ? `Style: ${style}. ` : ""}
        ${mood ? `Mood: ${mood}. ` : ""}
        The description should be engaging, artistic, and suitable for collectors. 
        Keep it between 100-200 words and highlight the unique aspects that would make this NFT valuable.`,
        system:
          "You are an expert art curator and NFT marketplace specialist. Create descriptions that capture the essence and value of digital artworks.",
      })

      return text
    } catch (error) {
      console.error("Error generating NFT description:", error)
      throw new Error("Failed to generate NFT description")
    }
  }

  // Market Analysis
  async analyzeNFTMarket(nftData: any[]) {
    try {
      const marketData = nftData.map((nft) => ({
        title: nft.title,
        price: nft.price_per_share,
        shares: nft.total_shares,
        volume: nft.volume || 0,
      }))

      const { text } = await generateText({
        model: xai("grok-beta"),
        prompt: `Analyze this NFT market data and provide insights:
        ${JSON.stringify(marketData, null, 2)}
        
        Provide analysis on:
        1. Price trends and patterns
        2. Volume analysis
        3. Market opportunities
        4. Risk assessment
        5. Investment recommendations
        
        Format as a structured market report.`,
        system:
          "You are a professional NFT market analyst with expertise in digital asset valuation and market trends.",
      })

      return text
    } catch (error) {
      console.error("Error analyzing NFT market:", error)
      throw new Error("Failed to analyze NFT market")
    }
  }

  // Smart Contract Audit Assistant
  async auditSmartContract(contractCode: string) {
    try {
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: `Review this Solidity smart contract code for security vulnerabilities and best practices:

        ${contractCode}

        Please provide:
        1. Security vulnerability assessment
        2. Gas optimization suggestions
        3. Best practice recommendations
        4. Potential attack vectors
        5. Overall security rating (1-10)

        Focus on common issues like reentrancy, overflow/underflow, access control, and gas optimization.`,
        system: "You are a senior smart contract security auditor with expertise in Solidity and blockchain security.",
      })

      return text
    } catch (error) {
      console.error("Error auditing smart contract:", error)
      throw new Error("Failed to audit smart contract")
    }
  }

  // Investment Advisor
  async getInvestmentAdvice(userPortfolio: any, marketData: any) {
    try {
      const { text } = await generateText({
        model: xai("grok-beta"),
        prompt: `Based on this user's NFT portfolio and current market data, provide personalized investment advice:

        User Portfolio:
        ${JSON.stringify(userPortfolio, null, 2)}

        Market Data:
        ${JSON.stringify(marketData, null, 2)}

        Provide:
        1. Portfolio diversification analysis
        2. Risk assessment
        3. Specific NFT recommendations
        4. Profit-taking strategies
        5. Market timing advice

        Keep advice practical and actionable.`,
        system: "You are a professional digital asset investment advisor specializing in NFT portfolio management.",
      })

      return text
    } catch (error) {
      console.error("Error generating investment advice:", error)
      throw new Error("Failed to generate investment advice")
    }
  }

  // Real-time Chat Support
  async *chatWithSupport(message: string, context?: any) {
    try {
      const stream = streamText({
        model: openai("gpt-4o"),
        prompt: `User message: ${message}
        ${context ? `Context: ${JSON.stringify(context)}` : ""}`,
        system: `You are a helpful NFTVaultChain platform support assistant. You can help users with:
        - Platform navigation and features
        - NFT minting and trading
        - Wallet connection issues
        - Transaction troubleshooting
        - Market insights
        - General platform questions
        
        Be friendly, helpful, and provide accurate information about the platform.`,
      })

      for await (const chunk of stream.textStream) {
        yield chunk
      }
    } catch (error) {
      console.error("Error in chat support:", error)
      throw new Error("Failed to process chat message")
    }
  }

  // Price Prediction
  async predictNFTPrice(tokenId: number, historicalData: any[]) {
    try {
      const { text } = await generateText({
        model: xai("grok-beta"),
        prompt: `Analyze this NFT's historical price data and predict future price movements:

        Token ID: ${tokenId}
        Historical Data:
        ${JSON.stringify(historicalData, null, 2)}

        Provide:
        1. Short-term price prediction (1-7 days)
        2. Medium-term outlook (1-4 weeks)
        3. Long-term projection (1-6 months)
        4. Key factors influencing price
        5. Confidence level for predictions

        Base predictions on technical analysis and market trends.`,
        system: "You are a quantitative analyst specializing in NFT price prediction and technical analysis.",
      })

      return text
    } catch (error) {
      console.error("Error predicting NFT price:", error)
      throw new Error("Failed to predict NFT price")
    }
  }
}

export const aiService = new AIService()
