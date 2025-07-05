"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, Gavel, DollarSign, Users, Zap, Activity } from "lucide-react"

interface MarketStats {
  totalVolume: string
  totalNFTs: number
  activeAuctions: number
  ethPrice: string
  gasPrice: string
  totalUsers: number
}

interface MarketStatsProps {
  stats: MarketStats
  loading: boolean
}

export function MarketStats({ stats, loading }: MarketStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-3"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Volume",
      value: `${stats.totalVolume} ETH`,
      change: "+12.5%",
      changeType: "positive",
      icon: TrendingUp,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-50 to-cyan-50",
    },
    {
      title: "Total NFTs",
      value: stats.totalNFTs.toLocaleString(),
      change: "+8 new",
      changeType: "positive",
      icon: Package,
      gradient: "from-purple-500 to-pink-500",
      bgGradient: "from-purple-50 to-pink-50",
    },
    {
      title: "Active Auctions",
      value: stats.activeAuctions.toString(),
      change: "5 ending today",
      changeType: "neutral",
      icon: Gavel,
      gradient: "from-orange-500 to-red-500",
      bgGradient: "from-orange-50 to-red-50",
    },
    {
      title: "ETH Price",
      value: `$${stats.ethPrice}`,
      change: "+2.1%",
      changeType: "positive",
      icon: DollarSign,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-50 to-emerald-50",
    },
    {
      title: "Gas Price",
      value: `${stats.gasPrice} gwei`,
      change: "Standard",
      changeType: "neutral",
      icon: Zap,
      gradient: "from-yellow-500 to-orange-500",
      bgGradient: "from-yellow-50 to-orange-50",
    },
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      change: "+156 today",
      changeType: "positive",
      icon: Users,
      gradient: "from-indigo-500 to-purple-500",
      bgGradient: "from-indigo-50 to-purple-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card
            key={index}
            className={`group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br ${stat.bgGradient} border-0 shadow-lg overflow-hidden relative`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
              <div
                className={`w-full h-full bg-gradient-to-br ${stat.gradient} rounded-full transform translate-x-6 -translate-y-6`}
              ></div>
            </div>

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="flex items-center gap-1">
                {stat.changeType === "positive" && <TrendingUp className="h-3 w-3 text-green-600" />}
                {stat.changeType === "negative" && <TrendingDown className="h-3 w-3 text-red-600" />}
                {stat.changeType === "neutral" && <Activity className="h-3 w-3 text-gray-600" />}
                <p
                  className={`text-xs ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : stat.changeType === "negative"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
