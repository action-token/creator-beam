"use client"

import { X } from "lucide-react"
import { Button } from "~/components/shadcn/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog"
import { useState } from "react"
import { BeamType } from "@prisma/client"
import { BEAM_COST } from "~/pages/beam/create"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  beamData: {
    recipientName: string
    senderName: string
    message: string
    beamType: BeamType
    generatedImage?: string | null
    uploadedVideo?: string | null
    enableAr?: boolean
  }
}

export default function PreviewModal({ isOpen, onClose, onConfirm, beamData }: PreviewModalProps) {
  const [showFront, setShowFront] = useState(true)

  const { recipientName, senderName, message, beamType, generatedImage, uploadedVideo } = beamData

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-primary-900 via-background to-muted-900 border-white/20">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 border-b border-white/20 bg-black/20">
          <div>
            <DialogTitle id="preview-title" className="text-xl sm:text-2xl font-bold text-white mb-1">
              Preview Your Beam
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base text-white/70">
              Check how it looks before purchasing for <b>{BEAM_COST} {PLATFORM_ASSET.code}</b>
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Preview Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)] p-4 sm:p-6">
          {/* Postcard/AI-Image Preview */}
          {(beamType === "POSTCARD" || beamType === "AI") && generatedImage && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center mb-4">
                <h3 className="text-white text-lg font-semibold mb-2">
                  For {recipientName} from {senderName}
                </h3>
              </div>

              <div
                className="cursor-pointer"
                style={{ perspective: "1000px" }}
                onClick={() => setShowFront(!showFront)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setShowFront(!showFront)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={
                  showFront
                    ? "Click or press Enter to flip card and view message"
                    : "Click or press Enter to flip card and view front"
                }
              >
                <div
                  className="relative transition-transform duration-700"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: showFront ? "rotateY(0deg)" : "rotateY(180deg)",
                    maxWidth: "500px",
                    width: "100%",
                  }}
                >
                  {/* Front - Image */}
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-2xl"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <img
                      src={generatedImage || "/placeholder.svg"}
                      alt={`Holiday postcard for ${recipientName}`}
                      className="w-full h-auto"
                    />
                    <div
                      className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded transform rotate-12 shadow-lg"
                      aria-hidden="true"
                    >
                      HOLIDAY 2025
                    </div>
                  </div>

                  {/* Back - Message */}
                  <div
                    className="absolute inset-0 bg-amber-50 rounded-2xl shadow-2xl p-6 flex flex-col"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                    aria-hidden={showFront}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-gray-500 text-sm">To:</p>
                        <p className="font-semibold text-gray-800">{recipientName}</p>
                      </div>
                      <div
                        className="w-16 h-20 border-2 border-dashed border-red-200 rounded flex items-center justify-center bg-red-50"
                        aria-hidden="true"
                      >
                        <span className="text-2xl">🎅</span>
                      </div>
                    </div>

                    <div className="flex-1 border-t-2 border-gray-200 pt-4">
                      <div
                        className="text-gray-700 whitespace-pre-wrap min-h-[100px]"
                        style={{
                          backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e5e5e5 28px)",
                          lineHeight: "28px",
                        }}
                      >
                        {message || "No message yet..."}
                      </div>
                    </div>

                    <div className="text-right mt-4 pt-4 border-t-2 border-gray-200">
                      <p className="text-gray-500 text-sm">With love,</p>
                      <p className="font-semibold text-gray-800">{senderName}</p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-white/70 text-sm text-center">
                Click the card or press Enter to flip and preview both sides
              </p>
            </div>
          )}

          {beamType === "VIDEO" && uploadedVideo && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center mb-4">
                <h3 className="text-white text-2xl font-bold mb-2">🎄 Video Beam 🎄</h3>
                <p className="text-white text-lg">
                  For <span className="font-semibold">{recipientName}</span> from{" "}
                  <span className="font-semibold">{senderName}</span>
                </p>
              </div>

              <div className="w-full max-w-2xl">
                {/* Video frame with festive animated border */}
                <div className="relative">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-red-500 via-green-500 via-yellow-500 to-red-500 animate-pulse opacity-75 blur-sm rounded-2xl"
                    style={{
                      animation: "pulse 3s ease-in-out infinite",
                      padding: "4px",
                    }}
                    aria-hidden="true"
                  />

                  <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl " style={{ margin: "4px", }}>
                    <video
                      src={uploadedVideo}
                      controls
                      className="w-full aspect-video object-contain"
                      aria-label={`Video beam for ${recipientName} from ${senderName}`}
                    />

                    {/* Decorative corner elements */}

                  </div>
                </div>

                {/* Optional message caption with beautiful styling */}
                {message && (
                  <div className="relative mt-6">
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-green-500/20 to-red-500/20 rounded-xl blur-xl"
                      aria-hidden="true"
                    />
                    <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl" aria-hidden="true">
                          💌
                        </div>
                        <div className="flex-1">
                          <p className="text-white/90 text-lg leading-relaxed italic">{message}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feature highlights */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-2xl mb-1" aria-hidden="true">
                      📱
                    </div>
                    <p className="text-white text-xs">Works on any device</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-2xl mb-1" aria-hidden="true">
                      🎬
                    </div>
                    <p className="text-white text-xs">3D AR viewing</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                    <div className="text-2xl mb-1" aria-hidden="true">
                      🔗
                    </div>
                    <p className="text-white text-xs">Easy to share</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Preview */}
          {beamType === "MESSAGE" && (
            <div className="flex flex-col items-center gap-6">
              <div className="w-full max-w-lg">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                  <div className="text-center mb-6">
                    <h3 className="text-white text-2xl font-bold mb-2">For {recipientName}</h3>
                    <p className="text-white/70 text-sm">From {senderName}</p>
                  </div>

                  <div className="bg-black/20 rounded-xl p-6 border border-white/10">
                    <p className="text-white text-lg whitespace-pre-wrap text-center leading-relaxed">{message}</p>
                  </div>

                  <div className="mt-6 text-center">
                    <span className="text-4xl" aria-hidden="true">
                      🎄
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div
            className="mt-8 bg-amber-500/20 backdrop-blur-sm border border-amber-500/30 rounded-xl p-4 text-center"
            role="note"
          >
            <p className="text-white text-sm">
              <span className="font-semibold" aria-hidden="true">
                ✨ After payment:
              </span>{" "}
              You{"'"}ll receive a shareable link and QR code to send this {beamType === "VIDEO" ? "video beam" : "beam"} to{" "}
              {recipientName}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className=" p-2">
          <Button
            variant="muted"
            onClick={onClose}
            className="flex-1 "
            aria-label="Go back to edit beam"
          >
            Go Back & Edit
          </Button>
          <Button
            onClick={onConfirm}
            variant={"accent"}
            className="flex-1  font-bold    "
            aria-label={`Confirm and purchase beam for ${BEAM_COST} ${PLATFORM_ASSET.code}`}
          >
            Pay {BEAM_COST} {PLATFORM_ASSET.code} to Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  )
}
