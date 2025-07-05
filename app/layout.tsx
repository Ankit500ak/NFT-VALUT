import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Web3Provider } from "@/contexts/web3-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NFTVaultChain - Fractional NFT Ownership Platform",
  description:
    "Create, fractionalize, and trade NFTs with built-in vault tokens. Own shares of valuable digital assets.",
  keywords: ["NFT", "Fractional Ownership", "Blockchain", "Ethereum", "Web3", "DeFi"],
  authors: [{ name: "NFTVaultChain Team" }],
  openGraph: {
    title: "NFTVaultChain - Fractional NFT Ownership",
    description: "Create, fractionalize, and trade NFTs with built-in vault tokens",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          {/* Navbar area - add VaultCoinBalance here */}
          {/* <VaultCoinBalance /> */}
          {children}
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  )
}
