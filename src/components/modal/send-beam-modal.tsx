"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "~/components/shadcn/ui/button"
import { Mail, X, Loader2 } from "lucide-react"
import { api } from "~/utils/api"

interface SendBeamModalProps {
  beamId: string
  recipientName: string
  senderName: string
  onClose: () => void
}

export function SendBeamModal({ beamId, recipientName, senderName, onClose }: SendBeamModalProps) {
  const [email, setEmail] = useState("")
  const [customRecipientName, setCustomRecipientName] = useState(recipientName)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const SendBeamEmail = api.beam.sendBeamEmail.useMutation(
    {
      onSuccess: (data) => {
        if (data.success) {
          setSuccess(true)
          setTimeout(() => {
            onClose()
          }, 2000)
          setSending(false)
        } else {
          setSending(false)
          setError(data.error ?? "Failed to send email")
        }
      },
      onError: (error) => {
        setSending(false)
        if (error.message.includes("UNAUTHORIZED")) {
          setError("Unauthorized: Please Login first.")
        }

      }
    }
  )
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSending(true)
    SendBeamEmail.mutate({
      beamId,
      recipientEmail: email
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold  mb-2">Send Your BEAM</h2>
          <p className="text-gray-600 text-sm">Share this special message via email</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-green-600 font-medium text-lg">Email sent successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-4">
            {/* Recipient Name */}
            <div>
              <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Name
              </label>
              <input
                id="recipientName"
                type="text"
                value={customRecipientName}
                onChange={(e) => setCustomRecipientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
                aria-required="true"
              />
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                required
                aria-required="true"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-transparent text-primary"
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send BEAM
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
