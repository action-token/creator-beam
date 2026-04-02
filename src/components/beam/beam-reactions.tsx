"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { api } from "~/utils/api"

interface BeamReactionsProps {
  beamId: string
}

const REACTIONS = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "laugh", emoji: "😂", label: "Funny" },
  { type: "party", emoji: "🎉", label: "Celebrate" },
  { type: "wow", emoji: "😮", label: "Wow" },
]

export function BeamReactions({ beamId }: BeamReactionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const session = useSession()
  const utils = api.useUtils()

  // Fetch beam data with reactions
  const { data: beam } = api.beam.getById.useQuery({ id: beamId })

  // Mutation for adding reaction
  const addReactionMutation = api.beam.addReaction.useMutation({
    onSuccess: () => {
      // Invalidate the beam query to refetch updated data
      utils.beam.getById.invalidate({ id: beamId })
    },
  })

  const handleReaction = async (reaction: { type: string; emoji: string }) => {
    setIsLoading(true)
    try {
      await addReactionMutation.mutateAsync({
        beamId,
        emoji: reaction.emoji,
      })
    } catch (error) {
      console.error("Failed to add reaction:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Count reactions by emoji
  const reactionCounts = beam?.reactions?.reduce(
    (acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  ) ?? {}

  // Get user's reactions
  const userReactionEmojis = beam?.reactions
    ?.filter((reaction) => reaction.userId === undefined) // This would need session context
    ?.map((reaction) => reaction.emoji) ?? []

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
      <h3 className="text-white font-semibold text-sm mb-3">React to this BEAM</h3>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map((reaction) => {
          const count = reactionCounts[reaction.emoji] ?? 0
          const isActive = userReactionEmojis.includes(reaction.emoji)
          return (
            <button
              key={reaction.type}
              onClick={() => handleReaction(reaction)}
              disabled={isLoading || addReactionMutation.isLoading || session.status === "unauthenticated"}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${isActive
                ? "bg-white/30 border-2 border-white/50 scale-105"
                : "bg-white/10 border border-white/20 hover:bg-white/20"
                } ${isLoading || addReactionMutation.isLoading || session.status === "unauthenticated" ? "opacity-50 cursor-not-allowed" : ""}`}
              aria-label={`${reaction.label} reaction${isActive ? " (active)" : ""}`}
            >
              <span className="text-xl">{reaction.emoji}</span>
              {count > 0 && <span className="text-white font-medium text-sm">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
