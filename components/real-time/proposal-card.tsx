"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ThumbsUp, ThumbsDown, Clock, Users, Vote } from "lucide-react"
import { useState } from "react"

interface Proposal {
  id: string
  title: string
  description: string
  votesFor: number
  votesAgainst: number
  endTime: Date
  status: "active" | "passed" | "failed"
  category: string
}

interface ProposalCardProps {
  proposal: Proposal
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const [hasVoted, setHasVoted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const totalVotes = proposal.votesFor + proposal.votesAgainst
  const forPercentage = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0
  const againstPercentage = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-blue-500 to-purple-500"
      case "passed":
        return "bg-gradient-to-r from-green-500 to-emerald-500"
      case "failed":
        return "bg-gradient-to-r from-red-500 to-pink-500"
      default:
        return "bg-gray-500"
    }
  }

  const timeLeft = Math.ceil((proposal.endTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <Card
      className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 bg-gradient-to-br from-white to-purple-50 border-0 shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <Vote className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">{proposal.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {proposal.category}
                </Badge>
                <Badge className={`${getStatusColor(proposal.status)} text-white border-0`}>
                  {proposal.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <p className="text-gray-600 leading-relaxed">{proposal.description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalVotes.toLocaleString()}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />
              Total Votes
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{forPercentage.toFixed(1)}%</div>
            <div className="text-sm text-gray-600">Support</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{timeLeft}</div>
            <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              Days Left
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* For Votes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">For: {proposal.votesFor.toLocaleString()}</span>
              </div>
              <span className="text-sm font-bold text-green-600">{forPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={forPercentage} className="h-3 bg-gray-200" />
          </div>

          {/* Against Votes */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">Against: {proposal.votesAgainst.toLocaleString()}</span>
              </div>
              <span className="text-sm font-bold text-red-600">{againstPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={againstPercentage} className="h-3 bg-gray-200" />
          </div>
        </div>

        {proposal.status === "active" && (
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-green-200 hover:border-green-500 hover:bg-green-50 hover:text-green-700 transition-all bg-transparent"
              onClick={() => setHasVoted(true)}
              disabled={hasVoted}
            >
              <ThumbsUp className="w-4 h-4 mr-2" />
              Vote For
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-200 hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition-all bg-transparent"
              onClick={() => setHasVoted(true)}
              disabled={hasVoted}
            >
              <ThumbsDown className="w-4 h-4 mr-2" />
              Vote Against
            </Button>
          </div>
        )}

        {hasVoted && (
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-700 font-medium">✓ Your vote has been recorded</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
