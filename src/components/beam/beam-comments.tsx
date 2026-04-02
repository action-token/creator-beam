"use client"

import type React from "react"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { api } from "~/utils/api"

interface BeamCommentsProps {
  beamId: string
}

export function BeamComments({ beamId }: BeamCommentsProps) {
  const [commentText, setCommentText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { data: session } = useSession()
  const utils = api.useUtils()

  // Fetch beam data with comments
  const { data: beam, isLoading } = api.beam.getById.useQuery({ id: beamId })

  // Mutation for adding comment
  const addCommentMutation = api.beam.addComment.useMutation({
    onSuccess: () => {
      // Invalidate the beam query to refetch updated data
      utils.beam.getById.invalidate({ id: beamId })
    },
    onError: (error) => {
      setError(error.message || "Failed to add comment")
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!commentText.trim()) {
      setError("Please enter a comment")
      return
    }

    if (!session?.user) {
      setError("You must be logged in to comment")
      return
    }

    try {
      await addCommentMutation.mutateAsync({
        beamId,
        content: commentText,
      })
      setCommentText("")
      setShowForm(false)
    } catch (err) {
      // Error is handled by onError callback
    }
  }



  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const comments = beam?.comments ?? []

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">Comments ({comments.length})</h3>
        {!showForm && session?.user && (
          <button
            onClick={() => setShowForm(true)}
            className="text-white text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            aria-label="Add a comment"
          >
            + Add Comment
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3">
          <div>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Leave a fun comment..."
              maxLength={500}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 resize-none"
              aria-label="Comment text"
            />
            <p className="text-white/50 text-xs mt-1">{commentText.length}/500</p>
          </div>
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={addCommentMutation.isLoading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-colors"
            >
              {addCommentMutation.isLoading ? "Posting..." : "Post Comment"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setCommentText("")
                setError(null)
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-white/50 text-center py-8">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-white/50 text-center py-8">No comments yet. Be the first to leave one!</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-lg p-3 border bg-white/5 border-white/10"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-white font-medium">{comment.user?.name ?? "Anonymous"}</span>
                <span className="text-white/50 text-xs">{formatDate(comment.createdAt.toString())}</span>
              </div>
              <p className="text-white/90 text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
