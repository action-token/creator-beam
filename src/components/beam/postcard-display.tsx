"use client"

import { useState, useEffect } from "react"

import { BeamComments } from "~/components/beam/beam-comments"
import { BeamReactions } from "~/components/beam/beam-reactions"
import VideoDisplay from "./video-display"
import Link from "next/link"
import { SendBeamModal } from "../modal/send-beam-modal"
import { api } from "~/utils/api"
import { Beam } from "@prisma/client"
import { useSession } from "next-auth/react"



export function PostcardDisplay({ beam, token }: { beam: Beam, token: string | null }) {
  const session = useSession()
  const [showFront, setShowFront] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedMessage, setEditedMessage] = useState(beam.message ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const [showSendModal, setShowSendModal] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const imageUrl = (beam.type === "POSTCARD" || beam.type === "AI") ? beam.contentUrl : null

  const CreateShareToken = api.beam.createShareToken.useMutation(
    {
      onSuccess: (data) => {
        setShareToken(data.token)
        const shareUrl = `${window.location.origin}/beam/${beam.id}?token=${data.token}`
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`)
      },
      onError: (error) => {
        const currentUrl = window.location.href
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentUrl)}`)
      },

    }
  )

  useEffect(() => {
    if (session.data?.user) {
      const generateShareToken = async () => {
        await CreateShareToken.mutateAsync({ beamId: beam.id })
      }
      generateShareToken()
    }
  }, [beam.id])

  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image()
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.src = imageUrl
    }
  }, [imageUrl])



  const isWidescreen =
    imageDimensions.width > 0 && imageDimensions.height > 0
      ? imageDimensions.width / imageDimensions.height > 1.5
      : false

  const cardMaxWidth = isWidescreen ? "800px" : "700px"

  return (
    <div
      className={`min-h-screen relative overflow-y-auto allow-scroll flex flex-col bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900`}
    >



      <div className="container mx-auto px-2 sm:px-4 py-12 relative z-10 flex-1">
        <div className="text-center mb-8">

          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-balance">
            A Special Message for {beam.recipientName}
          </h1>
          <p className="text-white/70">With love from {beam.senderName}</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-8 max-w-7xl mx-auto ">
          <div
            className="flex-shrink-0 cursor-pointer w-full "
            style={{ perspective: "1000px", maxWidth: cardMaxWidth }}
            onClick={() => !isEditing && setShowFront(!showFront)}
          >
            <div
              className="relative transition-transform duration-700 "
              style={{
                transformStyle: "preserve-3d",
                transform: showFront ? "rotateY(0deg)" : "rotateY(180deg)",
                width: "100%",
              }}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-accent" style={{ backfaceVisibility: "hidden" }}>
                {imageUrl ? (
                  <img
                    src={imageUrl || "/placeholder.svg"}

                    className="w-full h-auto"
                    style={{
                      maxHeight: isWidescreen ? "400px" : "none",
                      objectFit: isWidescreen ? "contain" : "cover",
                    }}
                  />
                ) :
                  beam.type === "VIDEO" ? <VideoDisplay beam={beam} /> :
                    (
                      <div
                        className={`w-full aspect-[4/3] flex items-center justify-center`}
                      >
                        <span className="text-6xl">
                          🎁
                        </span>
                      </div>
                    )}
                <div
                  className={`absolute top-3 right-3 text-white text-xs px-2 py-1 rounded transform rotate-12 shadow-lg bg-red-500}`}
                >

                  HOLIDAY 2025
                </div>
              </div>

              <div
                className="absolute inset-0 bg-amber-50 rounded-2xl shadow-2xl p-4 sm:p-6 flex flex-col"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex justify-between items-start mb-4 flex-shrink-0">
                  <div>
                    <p className="text-gray-500 text-xs sm:text-sm">From:</p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base mb-3">{beam.senderName}</p>
                    <p className="text-gray-500 text-xs sm:text-sm">To:</p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">{beam.recipientName}</p>
                  </div>
                  <div className="w-12 h-16 sm:w-16 sm:h-20 border-2 border-dashed border-red-200 rounded flex items-center justify-center bg-red-50">
                    <span className="text-xl sm:text-2xl">
                      🎄
                    </span>
                  </div>
                </div>

                <div className="flex-1 min-h-[180px] sm:min-h-[200px] border-t-2 border-gray-200 pt-4">

                  <div
                    className="text-gray-700 text-sm sm:text-base whitespace-pre-wrap"
                    style={{
                      backgroundImage: "repeating-linear-gradient(transparent, transparent 27px, #e5e5e5 28px)",
                      lineHeight: "28px",
                    }}
                  >
                    {beam.message ?? "No message yet..."}
                  </div>

                </div>



              </div>
            </div>
            <p className="text-white/50 text-sm text-center mt-3">Tap to flip</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {
              session.data?.user.id === beam.userId && (
                <div>
                  <p className="text-slate-300 mb-4">Scan the QR code to view in AR:</p>
                  <div className="bg-white p-4 rounded-2xl inline-block">
                    <img
                      src={qrCodeUrl ?? "/placeholder.svg"}
                      alt={`QR code for beam to ${beam.recipientName}`}
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                </div>
              )
            }
            <div className="w-full max-w-lg lg:max-w-md space-y-4">

              <button
                onClick={() => setShowFront(!showFront)}
                className="w-full bg-white/10 backdrop-blur-sm text-white py-3 px-6 rounded-xl font-medium hover:bg-white/20 transition-colors border border-white/20"
                aria-label={showFront ? "View message on back" : "View front of postcard"}
              >
                {showFront ? "💌 Read Message" : "🖼️ View Front"}
              </button>
              {
                beam.arEnabled && (


                  <button
                    onClick={() => {
                      const fullURL = `/ar-viewer/${beam.id}?token=${token ?? ""}`
                      window.location.href = fullURL
                    }}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-cyan-600 hover:to-blue-700 transition-colors"
                    aria-label="View in AR"
                  >
                    🕶️ View in AR
                  </button>
                )
              }
              {/* <button
                onClick={() => setShowSendModal(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center gap-2"
                aria-label="Send BEAM via email"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Send via Email
              </button> */}

              <button
                onClick={() => {
                  if (imageUrl) {
                    const link = document.createElement("a")
                    link.href = imageUrl
                    link.download = `postcard - ${beam.id}.png`
                    link.click()
                  }
                  if (beam.type === "VIDEO" && beam.contentUrl) {
                    const link = document.createElement("a")
                    link.href = beam.contentUrl
                    link.download = `postcard - video - ${beam.id}.mp4`
                    link.click()
                  }
                }}
                className={`w-full text-white py-3 px-6 rounded-xl font-medium transition-colors bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600`}
                aria-label="Download postcard image"
              >
                📥 Download
              </button>

              <button
                onClick={async () => {
                  const shareUrl = shareToken
                    ? `${window.location.origin}/beam/${beam.id}?token=${shareToken}`
                    : window.location.href

                  const shareData = {
                    title: `Holiday Postcard from ${beam.senderName}`,
                    text: beam.message ?? "Check out this holiday postcard!",
                    url: shareUrl,
                  }

                  if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
                    try {
                      await navigator.share(shareData)
                    } catch (err) {
                      await navigator.clipboard.writeText(shareUrl)
                      setShareCopied(true)
                      setTimeout(() => setShareCopied(false), 2000)
                    }
                  } else {
                    await navigator.clipboard.writeText(shareUrl)
                    setShareCopied(true)
                    setTimeout(() => setShareCopied(false), 2000)
                  }
                }}
                className="w-full bg-white text-gray-800 py-3 px-6 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                aria-label="Share BEAM link"
              >
                {shareCopied ? "✓ Link Copied!" : "🔗 Share Link"}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <span className="text-white/70 text-sm">👁️</span>
            <span className="text-white/90 font-medium text-sm">{beam.viewCount ?? 0} views</span>
          </div>
        </div>

        <div className="max-w-lg mx-auto mt-6">
          <BeamReactions beamId={beam.id} />
        </div>

        <div className="max-w-lg mx-auto mt-6">
          <BeamComments beamId={beam.id} />
        </div>

        <div className="max-w-lg mx-auto mt-6 text-center">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white`}
          >
            <span className="text-xl">✨</span>
            Create Your Own BEAM
            <span className="text-xl">✨</span>
          </Link>
        </div>

        {
          showSendModal && (
            <SendBeamModal
              beamId={beam.id}
              recipientName={beam.recipientName}
              senderName={beam.senderName}
              onClose={() => setShowSendModal(false)}
            />
          )
        }
      </div >


      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-15px) translateX(5px);
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
        @keyframes firework {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.5) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-firework {
          animation: firework ease-out infinite;
        }
        @keyframes bubble {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-bubble {
          animation: bubble linear infinite;
        }
      `}</style>
    </div >
  )
}
