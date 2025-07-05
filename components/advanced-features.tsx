"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  Users,
  Gift,
  Calendar,
  Trophy,
  Zap,
  Star,
  Crown,
  Coins,
  BarChartIcon as ChartBar,
  Bell,
  Settings,
  Shield,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdvancedFeaturesProps {
  account: string
  vaultBalance: number
}

export default function AdvancedFeatures({ account, vaultBalance }: AdvancedFeaturesProps) {
  const [activeTab, setActiveTab] = useState("rewards")
  const [dailyStreak, setDailyStreak] = useState(5)
  const [userLevel, setUserLevel] = useState(3)
  const [xpPoints, setXpPoints] = useState(1250)
  const [achievements, setAchievements] = useState([
    { id: 1, name: "First NFT", description: "Minted your first NFT", completed: true, reward: 10 },
    { id: 2, name: "Trader", description: "Complete 10 trades", completed: true, reward: 25 },
    { id: 3, name: "Collector", description: "Own shares in 5 different NFTs", completed: false, reward: 50 },
    { id: 4, name: "Influencer", description: "Refer 10 users", completed: false, reward: 100 },
  ])
  const [stakeAmount, setStakeAmount] = useState("")
  const [stakingRewards, setStakingRewards] = useState(45.5)
  const [notifications, setNotifications] = useState([
    { id: 1, type: "trade", message: "Your NFT share was sold for 5.2 VAULT", time: "2 hours ago" },
    { id: 2, type: "reward", message: "Daily bonus claimed: 1 VAULT", time: "1 day ago" },
    { id: 3, type: "achievement", message: "Achievement unlocked: Trader", time: "3 days ago" },
  ])
  const { toast } = useToast()

  const levelProgress = ((xpPoints % 500) / 500) * 100
  const nextLevelXP = 500 - (xpPoints % 500)

  const claimDailyReward = () => {
    setDailyStreak((prev) => prev + 1)
    setXpPoints((prev) => prev + 50)
    toast({
      title: "Daily Reward Claimed! 🎉",
      description: `Streak: ${dailyStreak + 1} days | +1 VAULT + 50 XP`,
    })
  }

  const stakeTokens = () => {
    if (!stakeAmount || Number.parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid staking amount",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(stakeAmount)
    if (amount > vaultBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough VAULT tokens to stake",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Staking Successful! 💎",
      description: `Staked ${amount} VAULT tokens. Earning 12% APY!`,
    })
    setStakeAmount("")
  }

  const claimAchievement = (achievementId: number) => {
    setAchievements((prev) =>
      prev.map((achievement) => (achievement.id === achievementId ? { ...achievement, completed: true } : achievement)),
    )

    const achievement = achievements.find((a) => a.id === achievementId)
    if (achievement) {
      setXpPoints((prev) => prev + achievement.reward)
      toast({
        title: "Achievement Unlocked! 🏆",
        description: `${achievement.name} - Earned ${achievement.reward} XP`,
      })
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Advanced Features</h2>
        <p className="text-gray-600">Explore rewards, staking, achievements, and more</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rewards">
            <Gift className="w-4 h-4 mr-2" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="staking">
            <Coins className="w-4 h-4 mr-2" />
            Staking
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Trophy className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <ChartBar className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* User Level Card */}
        <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Crown className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Level {userLevel}</h3>
                  <p className="text-purple-100">NFT Enthusiast</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Star className="w-4 h-4" />
                    <span>{xpPoints} XP</span>
                    <span className="text-purple-200">• {nextLevelXP} XP to next level</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{vaultBalance}</div>
                <div className="text-purple-200">VAULT Balance</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Level Progress</span>
                <span>{Math.round(levelProgress)}%</span>
              </div>
              <Progress value={levelProgress} className="bg-white/20" />
            </div>
          </CardContent>
        </Card>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Daily Rewards
                </CardTitle>
                <CardDescription>Claim your daily bonus and maintain your streak</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">{dailyStreak}</div>
                  <div className="text-gray-600">Day Streak</div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => (
                    <div
                      key={i}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                        i < dailyStreak % 7 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Today's Reward:</span>
                    <Badge variant="secondary">1 VAULT + 50 XP</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Streak Bonus:</span>
                    <Badge variant="outline">+{Math.floor(dailyStreak / 7)} VAULT</Badge>
                  </div>
                </div>

                <Button onClick={claimDailyReward} className="w-full">
                  <Gift className="w-4 h-4 mr-2" />
                  Claim Daily Reward
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Referral Program
                </CardTitle>
                <CardDescription>Earn rewards by inviting friends</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600">Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">60</div>
                    <div className="text-sm text-gray-600">VAULT Earned</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Referral Bonus:</span>
                    <span className="font-medium">5 VAULT per referral</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Your Referral Code:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{account.slice(0, 8)}...</code>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    const link = `${window.location.origin}?ref=${account}`
                    navigator.clipboard.writeText(link)
                    toast({ title: "Referral link copied!" })
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Copy Referral Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staking Tab */}
        <TabsContent value="staking">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="w-5 h-5 mr-2" />
                  Stake VAULT Tokens
                </CardTitle>
                <CardDescription>Earn passive income by staking your VAULT tokens</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">12%</div>
                    <div className="text-sm text-blue-800">Annual APY</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">30 Days</div>
                    <div className="text-sm text-green-800">Lock Period</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stake-amount">Amount to Stake</Label>
                  <Input
                    id="stake-amount"
                    type="number"
                    placeholder="Enter VAULT amount"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    max={vaultBalance}
                  />
                  <div className="text-xs text-gray-500">Available: {vaultBalance} VAULT</div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Estimated Monthly Reward:</span>
                    <span className="font-medium">
                      {stakeAmount ? (Number.parseFloat(stakeAmount) * 0.01).toFixed(2) : "0"} VAULT
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Annual Reward:</span>
                    <span className="font-medium">
                      {stakeAmount ? (Number.parseFloat(stakeAmount) * 0.12).toFixed(2) : "0"} VAULT
                    </span>
                  </div>
                </div>

                <Button onClick={stakeTokens} className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Stake Tokens
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Staking Positions</CardTitle>
                <CardDescription>Manage your active stakes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium">Active Stake #1</div>
                      <div className="text-sm text-gray-600">Started 15 days ago</div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Staked:</span>
                      <div className="font-medium">500 VAULT</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Rewards:</span>
                      <div className="font-medium text-green-600">{stakingRewards} VAULT</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Lock Period Progress</span>
                      <span>15/30 days</span>
                    </div>
                    <Progress value={50} />
                  </div>
                </div>

                <div className="text-center text-sm text-gray-600">
                  <p>Total Staking Rewards Earned</p>
                  <div className="text-2xl font-bold text-green-600 mt-1">{stakingRewards} VAULT</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <div className="grid md:grid-cols-2 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.completed ? "border-green-200 bg-green-50" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Trophy
                        className={`w-5 h-5 mr-2 ${achievement.completed ? "text-yellow-600" : "text-gray-400"}`}
                      />
                      {achievement.name}
                    </CardTitle>
                    {achievement.completed ? (
                      <Badge className="bg-green-500">Completed</Badge>
                    ) : (
                      <Badge variant="outline">In Progress</Badge>
                    )}
                  </div>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-gray-600">Reward: </span>
                      <span className="font-medium">{achievement.reward} XP</span>
                    </div>
                    {!achievement.completed && (
                      <Button size="sm" onClick={() => claimAchievement(achievement.id)}>
                        Claim
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Portfolio Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-bold">$2,450.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">24h Change:</span>
                    <span className="font-bold text-green-600">+5.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">7d Change:</span>
                    <span className="font-bold text-green-600">+12.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">All Time:</span>
                    <span className="font-bold text-green-600">+45.6%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trading Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Trades:</span>
                    <span className="font-bold">47</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-bold text-green-600">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. Trade Size:</span>
                    <span className="font-bold">125 VAULT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best Trade:</span>
                    <span className="font-bold text-green-600">+250 VAULT</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>NFT Collection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">NFTs Created:</span>
                    <span className="font-bold">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shares Owned:</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Collections:</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Royalties Earned:</span>
                    <span className="font-bold text-purple-600">89 VAULT</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Recent Notifications
              </CardTitle>
              <CardDescription>Stay updated with your account activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === "trade"
                          ? "bg-blue-500"
                          : notification.type === "reward"
                            ? "bg-green-500"
                            : "bg-purple-500"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="Enter username" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" placeholder="Tell us about yourself" rows={3} />
                </div>
                <Button className="w-full">Save Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-gray-600">Add extra security to your account</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive updates via email</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Privacy Settings</div>
                    <div className="text-sm text-gray-600">Control your data visibility</div>
                  </div>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
