"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Bell,
  BellRing,
  Check,
  X,
  Settings,
  Gavel,
  TrendingUp,
  Vote,
  ImageIcon,
  Coins,
  Users,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationSystemProps {
  account: string
}

interface Notification {
  id: string
  type: "auction" | "bid" | "sale" | "mint" | "governance" | "system" | "social"
  title: string
  message: string
  timestamp: number
  read: boolean
  actionUrl?: string
  metadata?: {
    tokenId?: number
    amount?: number
    auctionId?: number
    proposalId?: number
  }
}

interface NotificationSettings {
  auctions: boolean
  bids: boolean
  sales: boolean
  governance: boolean
  social: boolean
  system: boolean
  email: boolean
  push: boolean
}

export default function NotificationSystem({ account }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings>({
    auctions: true,
    bids: true,
    sales: true,
    governance: true,
    social: false,
    system: true,
    email: false,
    push: true,
  })
  const [activeTab, setActiveTab] = useState("all")
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()

  // Mock notifications for demonstration
  const mockNotifications: Notification[] = [
    {
      id: "1",
      type: "auction",
      title: "Auction Ending Soon",
      message: "Your auction for 'Digital Sunset' ends in 2 hours",
      timestamp: Date.now() - 30 * 60 * 1000, // 30 minutes ago
      read: false,
      actionUrl: "/auctions/1",
      metadata: { tokenId: 1, auctionId: 1 },
    },
    {
      id: "2",
      type: "bid",
      title: "New Bid Received",
      message: "Someone bid 2.5 ETH on your NFT 'Cyber Punk City'",
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      read: false,
      actionUrl: "/auctions/2",
      metadata: { tokenId: 2, amount: 2.5 },
    },
    {
      id: "3",
      type: "governance",
      title: "New Proposal Created",
      message: "A new governance proposal 'Reduce Minting Fee' is now open for voting",
      timestamp: Date.now() - 4 * 60 * 60 * 1000, // 4 hours ago
      read: true,
      actionUrl: "/governance/1",
      metadata: { proposalId: 1 },
    },
    {
      id: "4",
      type: "sale",
      title: "Shares Sold",
      message: "You successfully sold 25 shares of 'Abstract Dreams' for 1.2 ETH",
      timestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
      read: true,
      actionUrl: "/profile",
      metadata: { tokenId: 3, amount: 1.2 },
    },
    {
      id: "5",
      type: "system",
      title: "Welcome Bonus Received",
      message: "You've received 20 VAULT tokens as a welcome bonus!",
      timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      read: true,
      metadata: { amount: 20 },
    },
    {
      id: "6",
      type: "social",
      title: "NFT Liked",
      message: "Your NFT 'Digital Sunset' received 5 new likes",
      timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      read: true,
      actionUrl: "/nft/1",
      metadata: { tokenId: 1 },
    },
  ]

  useEffect(() => {
    loadNotifications()
    // Set up real-time notification listener
    const interval = setInterval(checkForNewNotifications, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [account])

  const loadNotifications = () => {
    // In real implementation, this would fetch from database/API
    setNotifications(mockNotifications)
  }

  const checkForNewNotifications = () => {
    // In real implementation, this would check for new notifications
    // For demo, we'll occasionally add a new notification
    if (Math.random() < 0.1) {
      // 10% chance
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: "bid",
        title: "New Bid Placed",
        message: "Someone placed a bid on an NFT you're watching",
        timestamp: Date.now(),
        read: false,
        actionUrl: "/marketplace",
      }

      setNotifications((prev) => [newNotification, ...prev])

      if (settings.push) {
        toast({
          title: newNotification.title,
          description: newNotification.message,
        })
      }
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const updateSettings = (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: "Settings Updated",
      description: `${key} notifications ${value ? "enabled" : "disabled"}`,
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "auction":
        return <Gavel className="w-5 h-5 text-purple-600" />
      case "bid":
        return <TrendingUp className="w-5 h-5 text-green-600" />
      case "sale":
        return <Coins className="w-5 h-5 text-yellow-600" />
      case "mint":
        return <ImageIcon className="w-5 h-5 text-blue-600" />
      case "governance":
        return <Vote className="w-5 h-5 text-indigo-600" />
      case "social":
        return <Users className="w-5 h-5 text-pink-600" />
      case "system":
        return <Info className="w-5 h-5 text-gray-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "auction":
        return "border-l-purple-500"
      case "bid":
        return "border-l-green-500"
      case "sale":
        return "border-l-yellow-500"
      case "mint":
        return "border-l-blue-500"
      case "governance":
        return "border-l-indigo-500"
      case "social":
        return "border-l-pink-500"
      case "system":
        return "border-l-gray-500"
      default:
        return "border-l-gray-500"
    }
  }

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getFilteredNotifications = () => {
    if (activeTab === "all") return notifications
    if (activeTab === "unread") return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.type === activeTab)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="w-8 h-8 text-blue-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-gray-600">Stay updated with your NFT activities</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>Customize which notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auctions" className="flex items-center space-x-2">
                      <Gavel className="w-4 h-4" />
                      <span>Auctions</span>
                    </Label>
                    <Switch
                      id="auctions"
                      checked={settings.auctions}
                      onCheckedChange={(checked) => updateSettings("auctions", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bids" className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>Bids & Sales</span>
                    </Label>
                    <Switch
                      id="bids"
                      checked={settings.bids}
                      onCheckedChange={(checked) => updateSettings("bids", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="governance" className="flex items-center space-x-2">
                      <Vote className="w-4 h-4" />
                      <span>Governance</span>
                    </Label>
                    <Switch
                      id="governance"
                      checked={settings.governance}
                      onCheckedChange={(checked) => updateSettings("governance", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="social" className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Social Activity</span>
                    </Label>
                    <Switch
                      id="social"
                      checked={settings.social}
                      onCheckedChange={(checked) => updateSettings("social", checked)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Delivery Methods</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push" className="flex items-center space-x-2">
                      <BellRing className="w-4 h-4" />
                      <span>Push Notifications</span>
                    </Label>
                    <Switch
                      id="push"
                      checked={settings.push}
                      onCheckedChange={(checked) => updateSettings("push", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>Email Notifications</span>
                    </Label>
                    <Switch
                      id="email"
                      checked={settings.email}
                      onCheckedChange={(checked) => updateSettings("email", checked)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
            <TabsTrigger value="auction">Auctions</TabsTrigger>
            <TabsTrigger value="governance">Governance</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>

        <TabsContent value={activeTab} className="space-y-4">
          {getFilteredNotifications().map((notification) => (
            <Card
              key={notification.id}
              className={`border-l-4 ${getNotificationColor(notification.type)} ${
                !notification.read ? "bg-blue-50/50" : ""
              } hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatTimeAgo(notification.timestamp)}</span>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {notification.actionUrl && (
                  <div className="mt-3 pt-3 border-t">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {getFilteredNotifications().length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <Bell className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Notifications</h3>
                <p className="text-gray-600">
                  {activeTab === "unread"
                    ? "You're all caught up! No unread notifications."
                    : "You don't have any notifications yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
