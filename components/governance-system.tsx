"use client"

import { useState, useEffect } from "react"
import type { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Vote, Users, Clock, CheckCircle, XCircle, AlertCircle, Plus, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GovernanceSystemProps {
  provider: ethers.BrowserProvider
  account: string
  vaultBalance: number
  votingPower: number
}

interface Proposal {
  id: number
  title: string
  description: string
  proposer: string
  startTime: number
  endTime: number
  executionTime: number
  forVotes: number
  againstVotes: number
  abstainVotes: number
  state: "Pending" | "Active" | "Succeeded" | "Failed" | "Executed" | "Cancelled"
  proposalType: "ChangeMintingFee" | "ChangePlatformFee" | "ChangeRoyaltyLimit" | "AddFeature" | "Emergency"
  hasVoted?: boolean
  userVote?: "For" | "Against" | "Abstain"
}

export default function GovernanceSystem({ provider, account, vaultBalance, votingPower }: GovernanceSystemProps) {
  const [activeTab, setActiveTab] = useState("proposals")
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [voteChoice, setVoteChoice] = useState<string>("")
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    proposalType: "",
    proposalData: "",
  })
  const { toast } = useToast()

  // Mock data for demonstration
  const mockProposals: Proposal[] = [
    {
      id: 1,
      title: "Reduce NFT Minting Fee to 0.01 ETH",
      description:
        "Proposal to reduce the current minting fee from 0.02 ETH to 0.01 ETH to make NFT creation more accessible to artists and creators. This change would encourage more participation in the platform while maintaining sustainability.",
      proposer: "0x1234...5678",
      startTime: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
      endTime: Date.now() + 5 * 24 * 60 * 60 * 1000, // 5 days from now
      executionTime: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
      forVotes: 1250,
      againstVotes: 340,
      abstainVotes: 110,
      state: "Active",
      proposalType: "ChangeMintingFee",
      hasVoted: false,
    },
    {
      id: 2,
      title: "Implement Advanced Analytics Dashboard",
      description:
        "Add comprehensive analytics and reporting features to help users track their NFT performance, market trends, and investment returns. This would include portfolio tracking, price history charts, and market insights.",
      proposer: "0x9876...4321",
      startTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      endTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago (ended)
      executionTime: Date.now() + 1 * 24 * 60 * 60 * 1000, // 1 day from now
      forVotes: 2100,
      againstVotes: 450,
      abstainVotes: 200,
      state: "Succeeded",
      proposalType: "AddFeature",
      hasVoted: true,
      userVote: "For",
    },
    {
      id: 3,
      title: "Increase Platform Fee to 3%",
      description:
        "Proposal to increase the platform fee from 2.5% to 3% to fund additional development and marketing efforts. The additional revenue would be used to improve platform features and expand our user base.",
      proposer: "0x5555...7777",
      startTime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
      endTime: Date.now() + 6 * 24 * 60 * 60 * 1000, // 6 days from now
      executionTime: Date.now() + 8 * 24 * 60 * 60 * 1000, // 8 days from now
      forVotes: 890,
      againstVotes: 1420,
      abstainVotes: 90,
      state: "Active",
      proposalType: "ChangePlatformFee",
      hasVoted: true,
      userVote: "Against",
    },
  ]

  useEffect(() => {
    loadProposals()
  }, [provider, account])

  const loadProposals = async () => {
    setIsLoading(true)
    try {
      // In real implementation, this would fetch from smart contract
      setProposals(mockProposals)
    } catch (error) {
      console.error("Error loading proposals:", error)
      toast({
        title: "Loading Error",
        description: "Failed to load proposals",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createProposal = async () => {
    if (!newProposal.title || !newProposal.description || !newProposal.proposalType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    if (votingPower < 1000) {
      toast({
        title: "Insufficient Voting Power",
        description: "You need at least 1000 voting power to create a proposal",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      toast({
        title: "Creating Proposal",
        description: "Your proposal is being submitted...",
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Proposal Created!",
        description: "Your proposal has been submitted for voting",
      })

      // Reset form
      setNewProposal({
        title: "",
        description: "",
        proposalType: "",
        proposalData: "",
      })

      // Reload proposals
      await loadProposals()
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: "Failed to create proposal",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const vote = async (proposalId: number, choice: string) => {
    if (!choice) {
      toast({
        title: "No Vote Selected",
        description: "Please select your vote choice",
        variant: "destructive",
      })
      return
    }

    if (votingPower === 0) {
      toast({
        title: "No Voting Power",
        description: "You need VAULT tokens to vote",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      toast({
        title: "Casting Vote",
        description: `Voting ${choice} with ${votingPower} voting power...`,
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Vote Cast!",
        description: `Successfully voted ${choice}`,
      })

      setVoteChoice("")
      setSelectedProposal(null)
      await loadProposals()
    } catch (error) {
      toast({
        title: "Vote Failed",
        description: "Failed to cast vote",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeProposal = async (proposalId: number) => {
    setIsLoading(true)
    try {
      toast({
        title: "Executing Proposal",
        description: "Proposal is being executed...",
      })

      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Proposal Executed!",
        description: "Proposal has been successfully executed",
      })

      await loadProposals()
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Failed to execute proposal",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "Active":
        return "bg-blue-500"
      case "Succeeded":
        return "bg-green-500"
      case "Failed":
        return "bg-red-500"
      case "Executed":
        return "bg-purple-500"
      case "Cancelled":
        return "bg-gray-500"
      default:
        return "bg-yellow-500"
    }
  }

  const getStateIcon = (state: string) => {
    switch (state) {
      case "Active":
        return <Clock className="w-4 h-4" />
      case "Succeeded":
        return <CheckCircle className="w-4 h-4" />
      case "Failed":
        return <XCircle className="w-4 h-4" />
      case "Executed":
        return <CheckCircle className="w-4 h-4" />
      case "Cancelled":
        return <XCircle className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now()
    const remaining = endTime - now

    if (remaining <= 0) return "Ended"

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) return `${days}d ${hours}h`
    return `${hours}h`
  }

  const getVotePercentage = (votes: number, total: number) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  const getTotalVotes = (proposal: Proposal) => {
    return proposal.forVotes + proposal.againstVotes + proposal.abstainVotes
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <Vote className="w-8 h-8 mr-3 text-blue-600" />
          Governance System
        </h2>
        <p className="text-gray-600">Shape the future of NFTVaultChain through community voting</p>

        <div className="flex justify-center space-x-6 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{vaultBalance.toFixed(2)}</div>
            <div className="text-sm text-gray-500">VAULT Balance</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{votingPower}</div>
            <div className="text-sm text-gray-500">Voting Power</div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposals">Active Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
          <TabsTrigger value="history">Voting History</TabsTrigger>
        </TabsList>

        {/* Active Proposals */}
        <TabsContent value="proposals">
          <div className="space-y-6">
            {proposals
              .filter((p) => p.state === "Active" || p.state === "Succeeded")
              .map((proposal) => {
                const totalVotes = getTotalVotes(proposal)
                const forPercentage = getVotePercentage(proposal.forVotes, totalVotes)
                const againstPercentage = getVotePercentage(proposal.againstVotes, totalVotes)
                const abstainPercentage = getVotePercentage(proposal.abstainVotes, totalVotes)

                return (
                  <Card key={proposal.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
                          <CardDescription className="text-base">{proposal.description}</CardDescription>
                        </div>
                        <Badge className={`${getStateColor(proposal.state)} text-white ml-4`}>
                          {getStateIcon(proposal.state)}
                          <span className="ml-1">{proposal.state}</span>
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
                        <span>
                          by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                        </span>
                        <span>{formatTimeRemaining(proposal.endTime)}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Voting Results */}
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Voting Results</h4>
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="w-4 h-4 mr-1" />
                            {totalVotes} total votes
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-green-600 font-medium">For ({forPercentage}%)</span>
                              <span>{proposal.forVotes} votes</span>
                            </div>
                            <Progress value={forPercentage} className="h-2" />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-red-600 font-medium">Against ({againstPercentage}%)</span>
                              <span>{proposal.againstVotes} votes</span>
                            </div>
                            <Progress value={againstPercentage} className="h-2" />
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600 font-medium">Abstain ({abstainPercentage}%)</span>
                              <span>{proposal.abstainVotes} votes</span>
                            </div>
                            <Progress value={abstainPercentage} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* Voting Section */}
                      {proposal.state === "Active" && !proposal.hasVoted && (
                        <div className="border-t pt-6">
                          <h4 className="font-medium mb-4">Cast Your Vote</h4>
                          <div className="space-y-4">
                            <RadioGroup
                              value={selectedProposal?.id === proposal.id ? voteChoice : ""}
                              onValueChange={(value) => {
                                setVoteChoice(value)
                                setSelectedProposal(proposal)
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="For" id={`for-${proposal.id}`} />
                                <Label htmlFor={`for-${proposal.id}`} className="text-green-600 font-medium">
                                  Vote For
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Against" id={`against-${proposal.id}`} />
                                <Label htmlFor={`against-${proposal.id}`} className="text-red-600 font-medium">
                                  Vote Against
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Abstain" id={`abstain-${proposal.id}`} />
                                <Label htmlFor={`abstain-${proposal.id}`} className="text-gray-600 font-medium">
                                  Abstain
                                </Label>
                              </div>
                            </RadioGroup>

                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Your voting power: {votingPower}</span>
                              <Button
                                onClick={() => vote(proposal.id, voteChoice)}
                                disabled={isLoading || !voteChoice || selectedProposal?.id !== proposal.id}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Vote className="w-4 h-4 mr-2" />
                                Cast Vote
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Already Voted */}
                      {proposal.hasVoted && (
                        <div className="border-t pt-6">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center">
                              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                              <span className="font-medium">You voted: {proposal.userVote}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Execute Button */}
                      {proposal.state === "Succeeded" && Date.now() >= proposal.executionTime && (
                        <div className="border-t pt-6">
                          <Button
                            onClick={() => executeProposal(proposal.id)}
                            disabled={isLoading}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Execute Proposal
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}

            {proposals.filter((p) => p.state === "Active" || p.state === "Succeeded").length === 0 && (
              <Card className="text-center py-16">
                <CardContent>
                  <Vote className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Active Proposals</h3>
                  <p className="text-gray-600">Be the first to create a proposal!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Create Proposal */}
        <TabsContent value="create">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
              <CardDescription>
                Submit a proposal for the community to vote on. You need at least 1000 voting power to create a
                proposal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {votingPower < 1000 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="font-medium text-yellow-800">Insufficient Voting Power</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    You need at least 1000 voting power to create a proposal. Current voting power: {votingPower}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a clear, descriptive title"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of your proposal, including rationale and expected impact"
                  value={newProposal.description}
                  onChange={(e) => setNewProposal((prev) => ({ ...prev, description: e.target.value }))}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposalType">Proposal Type</Label>
                <Select
                  value={newProposal.proposalType}
                  onValueChange={(value) => setNewProposal((prev) => ({ ...prev, proposalType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select proposal type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ChangeMintingFee">Change Minting Fee</SelectItem>
                    <SelectItem value="ChangePlatformFee">Change Platform Fee</SelectItem>
                    <SelectItem value="ChangeRoyaltyLimit">Change Royalty Limit</SelectItem>
                    <SelectItem value="AddFeature">Add New Feature</SelectItem>
                    <SelectItem value="Emergency">Emergency Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Proposal Timeline</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Voting Period:</span>
                    <div className="font-semibold">7 days</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Execution Delay:</span>
                    <div className="font-semibold">2 days</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Quorum Required:</span>
                    <div className="font-semibold">10%</div>
                  </div>
                </div>
              </div>

              <Button
                onClick={createProposal}
                disabled={
                  isLoading ||
                  !newProposal.title ||
                  !newProposal.description ||
                  !newProposal.proposalType ||
                  votingPower < 1000
                }
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Creating Proposal...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Proposal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voting History */}
        <TabsContent value="history">
          <div className="space-y-4">
            {proposals
              .filter((p) => p.state === "Executed" || p.state === "Failed" || p.state === "Cancelled")
              .map((proposal) => (
                <Card key={proposal.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{proposal.title}</h3>
                        <p className="text-gray-600 text-sm">{proposal.description.slice(0, 100)}...</p>
                      </div>
                      <Badge className={`${getStateColor(proposal.state)} text-white`}>
                        {getStateIcon(proposal.state)}
                        <span className="ml-1">{proposal.state}</span>
                      </Badge>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">For Votes:</span>
                        <div className="font-semibold text-green-600">{proposal.forVotes}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Against Votes:</span>
                        <div className="font-semibold text-red-600">{proposal.againstVotes}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Total Votes:</span>
                        <div className="font-semibold">{getTotalVotes(proposal)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Your Vote:</span>
                        <div className="font-semibold">{proposal.hasVoted ? proposal.userVote : "Did not vote"}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

            {proposals.filter((p) => p.state === "Executed" || p.state === "Failed" || p.state === "Cancelled")
              .length === 0 && (
              <Card className="text-center py-16">
                <CardContent>
                  <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Voting History</h3>
                  <p className="text-gray-600">Participate in governance to build your voting history!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
