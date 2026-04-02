"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "~/components/shadcn/ui/button"
import { Input } from "~/components/shadcn/ui/input"
import { Label } from "~/components/shadcn/ui/label"
import { Textarea } from "~/components/shadcn/ui/textarea"
import Image from "next/image"
import { UploadS3Button } from "../common/upload-button"
import toast from "react-hot-toast"
import { generateImage } from "~/pages/api/generate-image"
import { api } from "~/utils/api"
// import { generateImage } from "@/app/actions/generate-image"

const PRESET_CATEGORIES = [
  {
    id: "christmas",
    name: "Christmas",
    icon: "🎄",
    presets: [
      {
        id: "winter-wonderland",
        name: "Winter Wonderland",
        prompt:
          "Transform into a magical winter wonderland scene with snow, ice crystals, northern lights, and a cozy Christmas cabin in the background",
        icon: "❄️",
      },
      {
        id: "santa-workshop",
        name: "Santa's Workshop",
        prompt:
          "Transform into a whimsical Santa's workshop scene with elves, toys, candy canes, and festive Christmas lights",
        icon: "🎅",
      },
      {
        id: "cozy-fireplace",
        name: "Cozy Fireplace",
        prompt:
          "Transform into a warm cozy scene by a crackling fireplace with stockings, hot cocoa, and a decorated Christmas tree",
        icon: "🔥",
      },
      {
        id: "gingerbread-village",
        name: "Gingerbread Village",
        prompt:
          "Transform into a magical gingerbread village scene with candy houses, frosting snow, and gumdrop decorations",
        icon: "🏠",
      },
      {
        id: "nutcracker-magic",
        name: "Nutcracker Magic",
        prompt:
          "Transform into a dreamy Nutcracker ballet scene with toy soldiers, sugar plum fairies, and sparkling snowflakes",
        icon: "🩰",
      },
      {
        id: "reindeer-flight",
        name: "Reindeer Flight",
        prompt:
          "Transform into a magical night sky scene with Santa's sleigh, flying reindeer, and a glowing moon over snowy rooftops",
        icon: "🦌",
      },
    ],
  },
  {
    id: "new-year",
    name: "New Year",
    icon: "🎆",
    presets: [
      {
        id: "midnight-celebration",
        name: "Midnight Celebration",
        prompt:
          "Transform into a stunning New Year's Eve midnight celebration scene with spectacular fireworks bursting over a glittering city skyline, champagne toasts, countdown numbers, and golden confetti falling",
        icon: "🎆",
      },
      {
        id: "champagne-toast",
        name: "Champagne Toast",
        prompt:
          "Transform into an elegant champagne toast scene with sparkling glasses clinking, golden bubbles, luxury party decorations, and celebratory New Year's atmosphere",
        icon: "🥂",
      },
      {
        id: "countdown-clock",
        name: "Countdown Clock",
        prompt:
          "Transform into a dramatic countdown scene with a large clock striking midnight, numbers changing to the new year, fireworks exploding, and excited celebration vibes",
        icon: "🕛",
      },
      {
        id: "fireworks-spectacular",
        name: "Fireworks Spectacular",
        prompt:
          "Transform into a breathtaking fireworks display scene with colorful bursts lighting up the night sky, reflection in water, crowds celebrating, and magical New Year's energy",
        icon: "🎇",
      },
      {
        id: "resolution-fresh-start",
        name: "Fresh Start",
        prompt:
          "Transform into an inspiring fresh start scene with sunrise over mountains, new calendar page, goals and dreams symbols, optimistic colors, and hopeful New Year beginning vibes",
        icon: "🌅",
      },
      {
        id: "party-celebration",
        name: "Party Celebration",
        prompt:
          "Transform into a vibrant New Year's party scene with disco balls, streamers, confetti cannons, dancing silhouettes, champagne bottles, and energetic celebration atmosphere",
        icon: "🎊",
      },
    ],
  },
  {
    id: "hanukkah",
    name: "Hanukkah",
    icon: "🕎",
    presets: [
      {
        id: "menorah-lighting",
        name: "Menorah Lighting",
        prompt:
          "Transform into a warm Hanukkah scene with a glowing menorah with eight candles plus shamash, soft candlelight, blue and white decorations, and peaceful celebration atmosphere",
        icon: "🕎",
      },
      {
        id: "dreidel-celebration",
        name: "Dreidel Celebration",
        prompt:
          "Transform into a festive Hanukkah scene with colorful dreidels spinning, chocolate gelt coins, playful atmosphere, blue and silver decorations, and joyful family gathering vibes",
        icon: "🎲",
      },
      {
        id: "star-of-david",
        name: "Star of David",
        prompt:
          "Transform into an elegant Hanukkah scene with Stars of David, shimmering blue and silver colors, starlight, sacred symbols, and spiritual celebration atmosphere",
        icon: "✡️",
      },
      {
        id: "latkes-feast",
        name: "Latkes & Feast",
        prompt:
          "Transform into a delicious Hanukkah feast scene with golden latkes, sufganiyot donuts, festive table setting, warm family gathering, and celebration of traditional foods",
        icon: "🥔",
      },
      {
        id: "eight-nights",
        name: "Eight Nights",
        prompt:
          "Transform into a symbolic Hanukkah scene showing the progression of eight nights, candles being lit one by one, growing light overcoming darkness, and miracle celebration vibes",
        icon: "🕯️",
      },
      {
        id: "hanukkah-gifts",
        name: "Gift Giving",
        prompt:
          "Transform into a joyful Hanukkah gift exchange scene with wrapped presents in blue and silver, happy children, gelt coins, and family celebration atmosphere",
        icon: "🎁",
      },
    ],
  },
  {
    id: "everyday",
    name: "Everyday",
    icon: "🌟",
    presets: [
      {
        id: "congratulations",
        name: "Congratulations",
        icon: "🎉",
        prompt:
          "Transform into a celebratory scene with confetti, sparkles, and achievement elements like trophies and ribbons with bright, uplifting colors",
      },
      {
        id: "get-well",
        name: "Get Well Soon",
        icon: "💐",
        prompt:
          "Transform into a comforting get-well scene with soft flowers, warm sunshine, gentle colors, blooming flowers, and peaceful healing vibes",
      },
      {
        id: "thank-you",
        name: "Thank You",
        icon: "🙏",
        prompt:
          "Transform into a grateful scene with warm golden light, elegant thank you elements, graceful decorations, and heartfelt appreciation vibes",
      },
      {
        id: "thinking-of-you",
        name: "Thinking of You",
        icon: "💭",
        prompt:
          "Transform into a thoughtful scene with gentle clouds, soft pastels, caring elements like hearts and flowers, and tender, comforting atmosphere",
      },
      {
        id: "good-luck",
        name: "Good Luck",
        icon: "🍀",
        prompt:
          "Transform into a lucky scene with four-leaf clovers, horseshoes, shooting stars, good fortune symbols, and energetic, optimistic atmosphere",
      },
      {
        id: "welcome",
        name: "Welcome",
        icon: "👋",
        prompt:
          "Transform into a welcoming scene with open doors, friendly elements, cheerful greetings, balloons, and warm, inviting atmosphere",
      },
      {
        id: "miss-you",
        name: "Miss You",
        icon: "💌",
        prompt:
          "Transform into a nostalgic scene with soft memories, distant stars, sentimental elements, warm glow, and heartfelt longing atmosphere",
      },
      {
        id: "just-because",
        name: "Just Because",
        icon: "💝",
        prompt:
          "Transform into a spontaneous, joyful scene with playful elements, surprise touches, whimsical decorations, and cheerful, unexpected delight vibes",
      },
    ],
  },
  {
    id: "birthday",
    name: "Birthday",
    icon: "🎂",
    presets: [
      {
        id: "party-time",
        name: "Party Time",
        prompt:
          "Transform into a vibrant birthday party scene with colorful balloons, confetti, streamers, and festive decorations",
        icon: "🎉",
      },
      {
        id: "cake-celebration",
        name: "Cake Celebration",
        prompt:
          "Transform into a sweet birthday cake scene with layered frosting, lit candles, sprinkles, and a beautiful dessert table",
        icon: "🎂",
      },
      {
        id: "golden-birthday",
        name: "Golden Birthday",
        prompt:
          "Transform into an elegant golden birthday scene with metallic gold decorations, champagne, and luxury celebration elements",
        icon: "✨",
      },
      {
        id: "kids-party",
        name: "Kids Party",
        prompt:
          "Transform into a fun kids birthday party scene with bright colors, cartoon elements, toys, and playful decorations",
        icon: "🎈",
      },
      {
        id: "milestone-birthday",
        name: "Milestone Birthday",
        prompt:
          "Transform into a milestone birthday scene with number decorations, photo memories, and special celebration elements",
        icon: "🎊",
      },
      {
        id: "surprise-party",
        name: "Surprise Party",
        prompt:
          "Transform into a surprise party scene with wrapped presents, hidden decorations ready to reveal, and exciting atmosphere",
        icon: "🎁",
      },
    ],
  },
]

interface VibeStudioProps {
  onSelectImage: (imageUrl: string) => void
  onClose: () => void
}

export function VibeStudio({ onSelectImage, onClose }: VibeStudioProps) {
  const [mode, setMode] = useState<"choose" | "they-create" | "we-create">("choose")
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("christmas")
  const [customPrompt, setCustomPrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [generatedImages, setGeneratedImages] = useState<string[]>([])
  const [generationCount, setGenerationCount] = useState(0)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const MAX_GENERATIONS = 3
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [overlayText, setOverlayText] = useState("")


  const compressImage = async (base64Image: string, maxSizeKB = 3000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img")
      img.crossOrigin = "anonymous"
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate scaling to keep image under target size
        const maxDimension = 1920 // Max width or height
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Start with quality 0.9 and reduce if needed
        let quality = 0.9
        let compressedBase64 = canvas.toDataURL("image/jpeg", quality)

        // Iteratively reduce quality until under target size
        while (compressedBase64.length > maxSizeKB * 1024 * (4 / 3) && quality > 0.1) {
          quality -= 0.1
          compressedBase64 = canvas.toDataURL("image/jpeg", quality)
        }

        console.log(
          "[v0] Compressed image from",
          base64Image.length,
          "to",
          compressedBase64.length,
          "chars at quality",
          quality,
        )
        resolve(compressedBase64)
      }

      img.onerror = () => reject(new Error("Failed to load image for compression"))
      img.src = base64Image
    })
  }

  const handleTransform = async () => {
    if (!uploadedImage || isGenerating) return
    if (generationCount >= MAX_GENERATIONS) return



    let promptToUse =
      customPrompt ||
      (selectedPreset
        ? PRESET_CATEGORIES.flatMap((cat) => cat.presets).find((p) => p.id === selectedPreset)?.prompt
        : null)
    console.log("[v0] Custom prompt:", customPrompt ?? "none")
    console.log("[v0] Selected preset:", selectedPreset ?? "none")
    if (selectedPreset) {
      console.log("[v0] Using preset prompt:", selectedPreset)
    }
    console.log("[v0] Final prompt length:", promptToUse?.length ?? 0)

    if (!promptToUse) {
      setError("Please select a vibe preset or enter a custom prompt")
      return
    }

    if (overlayText.trim()) {
      console.log("[v0] Adding overlay text:", overlayText)
      // Append overlay text to the prompt
      promptToUse += `. Add the text "${overlayText}" as a stylish overlay on the image, integrated beautifully into the design.`
    }

    console.log("[v0] Image size (base64):", uploadedImage.length, "chars")

    console.log("[v0] Compressing image before sending...")
    let imageToSend = uploadedImage
    try {
      imageToSend = await compressImage(uploadedImage, 3000) // Target 3MB
      console.log("[v0] Compressed image size:", imageToSend.length, "chars")
    } catch (compressionError) {
      console.error("[v0] Compression error:", compressionError)
      setError("Failed to compress image. Please try a smaller image.")
      return
    }

    console.log("[v0] Starting image transformation...")

    setIsGenerating(true)
    setError(null)

    try {
      console.log("[v0] Sending image to API route...")

      const response = await fetch("/api/transform-image-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: imageToSend,
          prompt: promptToUse,
        }),
      })
      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        toast.error("Error : Generating Image Failed")

      }

      const result = await response.json() as {
        success: boolean
        url?: string
      }



      if (!result.url) {
        console.error("[v0] Transform succeeded but no URL returned")
        throw new Error("No image URL returned")
      }

      console.log("[v0] Setting generated image")
      setGeneratedImage(result.url)
      setGeneratedImages((prev) => {
        console.log("[v0] Adding to generated images array, current count:", prev.length)
        return [...prev, result.url!]
      })
      setGenerationCount((prev) => {
        const newCount = prev + 1
        console.log("[v0] Incrementing generation count to:", newCount)
        return newCount
      })
      setSelectedImageIndex(generationCount)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to transform image"
      console.error("[v0] Transform error caught:", errorMessage)
      console.error("[v0] Full error:", err)
      setError(errorMessage)
    } finally {
      console.log("[v0] Transform process finished, setting isGenerating to false")
      setIsGenerating(false)
    }
  }


  const GenerateAIResponse = api.beam.gererateAIResponse.useMutation(
    {
      onSuccess: (result) => {
        setIsGenerating(false)
        if (!result.success) {
          console.error("[v0] Generation failed:", result.error)
          throw new Error(result.error ?? "Generation failed")
        }

        if (!result.url) {
          console.error("[v0] Generation succeeded but no URL returned")
          throw new Error("No image URL returned")
        }

        console.log("[v0] Setting generated image, URL prefix:", result.url.substring(0, 50))
        setGeneratedImage(result.url)
        setGeneratedImages((prev) => {
          console.log("[v0] Adding to generated images array, current count:", prev.length)
          return [...prev, result.url!]
        })
        console.log("[v0] Generation completed successfully!")

      },
      onError: (error) => {
        setIsGenerating(false)
        console.error("[v0] Generation error caught:", error)
        setError(error.message)
      }

    }
  )
  const handleGenerate = async () => {
    console.log("[v0] Generate started (we-create mode)")

    let prompt = customPrompt
    console.log("[v0] Custom prompt:", customPrompt ?? "none")
    console.log("[v0] Selected preset:", selectedPreset ?? "none")

    const presetStyles: Record<string, { prompt: string }> = {
      "winter-wonderland": {
        prompt:
          "Transform into a magical winter wonderland scene with snow, ice crystals, northern lights, and a cozy Christmas cabin in the background",
      },
      "santa-workshop": {
        prompt:
          "Transform into a whimsical Santa's workshop scene with elves, toys, candy canes, and festive Christmas lights",
      },
      "cozy-fireplace": {
        prompt:
          "Transform into a warm cozy scene by a crackling fireplace with stockings, hot cocoa, and a decorated Christmas tree",
      },
      "gingerbread-village": {
        prompt:
          "Transform into a magical gingerbread village scene with candy houses, frosting snow, and gumdrop decorations",
      },
      "nutcracker-magic": {
        prompt:
          "Transform into a dreamy Nutcracker ballet scene with toy soldiers, sugar plum fairies, and sparkling snowflakes",
      },
      "reindeer-flight": {
        prompt:
          "Transform into a magical night sky scene with Santa's sleigh, flying reindeer, and a glowing moon over snowy rooftops",
      },
      congratulations: {
        prompt:
          "Transform into a celebratory scene with confetti, sparkles, and achievement elements like trophies and ribbons with bright, uplifting colors",
      },
      "get-well": {
        prompt:
          "Transform into a comforting get-well scene with soft flowers, warm sunshine, gentle colors, blooming flowers, and peaceful healing vibes",
      },
      "thank-you": {
        prompt:
          "Transform into a grateful scene with warm golden light, elegant thank you elements, graceful decorations, and heartfelt appreciation vibes",
      },
      "thinking-of-you": {
        prompt:
          "Transform into a thoughtful scene with gentle clouds, soft pastels, caring elements like hearts and flowers, and tender, comforting atmosphere",
      },
      "good-luck": {
        prompt:
          "Transform into a lucky scene with four-leaf clovers, horseshoes, shooting stars, good fortune symbols, and energetic, optimistic atmosphere",
      },
      welcome: {
        prompt:
          "Transform into a welcoming scene with open doors, friendly elements, cheerful greetings, balloons, and warm, inviting atmosphere",
      },
      "miss-you": {
        prompt:
          "Transform into a nostalgic scene with soft memories, distant stars, sentimental elements, warm glow, and heartfelt longing atmosphere",
      },
      "just-because": {
        prompt:
          "Transform into a spontaneous, joyful scene with playful elements, surprise touches, whimsical decorations, and cheerful, unexpected delight vibes",
      },
      "party-time": {
        prompt:
          "Transform into a vibrant birthday party scene with colorful balloons, confetti, streamers, and festive decorations",
      },
      "cake-celebration": {
        prompt:
          "Transform into a sweet birthday cake scene with layered frosting, lit candles, sprinkles, and a beautiful dessert table",
      },
      "golden-birthday": {
        prompt:
          "Transform into an elegant golden birthday scene with metallic gold decorations, champagne, and luxury celebration elements",
      },
      "kids-party": {
        prompt:
          "Transform into a fun kids birthday party scene with bright colors, cartoon elements, toys, and playful decorations",
      },
      "milestone-birthday": {
        prompt:
          "Transform into a milestone birthday scene with number decorations, photo memories, and special celebration elements",
      },
      "surprise-party": {
        prompt:
          "Transform into a surprise party scene with wrapped presents, hidden decorations ready to reveal, and exciting atmosphere",
      },
      "midnight-celebration": {
        prompt:
          "Transform into a stunning New Year's Eve midnight celebration scene with spectacular fireworks bursting over a glittering city skyline, champagne toasts, countdown numbers, and golden confetti falling",
      },
      "champagne-toast": {
        prompt:
          "Transform into an elegant champagne toast scene with sparkling glasses clinking, golden bubbles, luxury party decorations, and celebratory New Year's atmosphere",
      },
      "countdown-clock": {
        prompt:
          "Transform into a dramatic countdown scene with a large clock striking midnight, numbers changing to the new year, fireworks exploding, and excited celebration vibes",
      },
      "fireworks-spectacular": {
        prompt:
          "Transform into a breathtaking fireworks display scene with colorful bursts lighting up the night sky, reflection in water, crowds celebrating, and magical New Year's energy",
      },
      "resolution-fresh-start": {
        prompt:
          "Transform into an inspiring fresh start scene with sunrise over mountains, new calendar page, goals and dreams symbols, optimistic colors, and hopeful New Year beginning vibes",
      },
      "party-celebration": {
        prompt:
          "Transform into a vibrant New Year's party scene with disco balls, streamers, confetti cannons, dancing silhouettes, champagne bottles, and energetic celebration atmosphere",
      },
      "menorah-lighting": {
        prompt:
          "Transform into a warm Hanukkah scene with a glowing menorah with eight candles plus shamash, soft candlelight, blue and white decorations, and peaceful celebration atmosphere",
      },
      "dreidel-celebration": {
        prompt:
          "Transform into a festive Hanukkah scene with colorful dreidels spinning, chocolate gelt coins, playful atmosphere, blue and silver decorations, and joyful family gathering vibes",
      },
      "star-of-david": {
        prompt:
          "Transform into an elegant Hanukkah scene with Stars of David, shimmering blue and silver colors, starlight, sacred symbols, and spiritual celebration atmosphere",
      },
      "latkes-feast": {
        prompt:
          "Transform into a delicious Hanukkah feast scene with golden latkes, sufganiyot donuts, festive table setting, warm family gathering, and celebration of traditional foods",
      },
      "eight-nights": {
        prompt:
          "Transform into a symbolic Hanukkah scene showing the progression of eight nights, candles being lit one by one, growing light overcoming darkness, and miracle celebration vibes",
      },
      "hanukkah-gifts": {
        prompt:
          "Transform into a joyful Hanukkah gift exchange scene with wrapped presents in blue and silver, happy children, gelt coins, and family celebration atmosphere",
      },
      default: { prompt: "" },
    }

    if (selectedPreset && !customPrompt) {
      const preset = presetStyles[selectedPreset]
      if (preset) {
        prompt = preset.prompt
        console.log("[v0] Using preset prompt:", selectedPreset)
      }
    }

    if (!prompt || prompt.length < 10) {
      console.log("[v0] Error: Prompt too short or missing")
      setError("Please select a preset or enter a custom prompt")
      return
    }

    if (overlayText.trim()) {
      console.log("[v0] Adding overlay text:", overlayText)
      prompt += ` Include the text "${overlayText}" as a stylish overlay on the image, integrated beautifully into the design.`
    }

    console.log("[v0] Final prompt:", prompt.substring(0, 100) + "...")
    console.log("[v0] Starting image generation...")

    setIsGenerating(true)
    setError(null)

    GenerateAIResponse.mutate(
      {
        prompt,
      },
    )

  }

  const handleUseImage = () => {
    const imageToUse = selectedImageIndex !== null ? generatedImages[selectedImageIndex] : generatedImage
    if (imageToUse) {
      onSelectImage(imageToUse)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-gradient-to-br from-primary-950/90 to-green-950/90 border border-white/20 rounded-2xl w-full  md:w-[65vw] max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-900/95 to-green-900/95 backdrop-blur-sm p-3 sm:p-4 border-b border-white/10 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">🎨</span> VibeStudio
            </h2>
            <p className="text-white/60 text-xs sm:text-sm">Create magical holiday postcards</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white/60 hover:text-white hover:bg-white/10 px-2 sm:px-4"
            aria-label="Close VibeStudio"
          >
            Close
          </Button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Mode Selection */}
          {mode === "choose" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <button
                onClick={() => setMode("they-create")}
                className="p-6 sm:p-8 rounded-2xl  border border-red-500/30 hover:border-red-400/50 transition-all group"
                aria-label="Upload and transform your own image"
              >
                <div className="text-5xl sm:text-6xl mb-4">📸</div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">I{"'"}ll Create</h3>
                <p className="text-white/60 text-sm">Upload your own photo and transform it with our magic presets</p>
                <div className="mt-4  text-sm font-medium">
                  Upload & Transform →
                </div>
              </button>

              <button
                onClick={() => setMode("we-create")}
                className="p-6 sm:p-8 rounded-2xl  border border-green-500/30 hover:border-green-400/50 transition-all group"
                aria-label="Let AI generate an image from scratch"
              >
                <div className="text-5xl sm:text-6xl mb-4">🤖</div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">AI Creates</h3>
                <p className="text-white/60 text-sm">Let our AI generate a unique postcard from scratch</p>
                <div className="mt-4 text-sm font-medium">
                  Generate Magic →
                </div>
              </button>
            </div>
          )}

          {/* They Create Mode */}
          {mode === "they-create" && (
            <div className="space-y-4 sm:space-y-6">
              <Button
                onClick={() => setMode("choose")}
                variant="outline"
                className="border-white/20 hover:bg-white/10 text-black bg-green-600"
                aria-label="Go back to mode selection"
              >
                ← Back
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 sm:gap-6">
                {/* Left: Upload and Preview */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">1. Upload & Preview</h3>


                  <UploadS3Button
                    id='fileInput'
                    className="hidden"
                    endpoint="imageUploader"
                    onUploadProgress={(progress) => {
                      console.log("Upload Progress: ", progress)
                    }}
                    onClientUploadComplete={async (res) => {
                      const data = res
                      if (data?.url) {
                        setUploadedImage(data.url)
                      }
                    }}
                    onUploadError={(error: Error) => {
                      console.log("ERROR UPLOADING: ", error)

                    }}
                  />


                  {/* Upload Section */}
                  <div className="space-y-2">
                    <p className="text-white/60 text-sm">Upload Your Image</p>
                    {!uploadedImage ? (
                      <button
                        onClick={() => document.getElementById("fileInput")?.click()}
                        className="w-full aspect-square max-h-48 sm:max-h-80 rounded-xl border-2 border-dashed border-white/30 hover:border-white/50 flex flex-col items-center justify-center gap-3 transition-colors"
                        aria-label="Click to upload image"
                      >
                        <span className="text-4xl sm:text-5xl block mb-2" aria-hidden="true">
                          📷
                        </span>
                        <span className="text-white/60 text-sm">Tap to upload</span>
                      </button>
                    ) : (
                      <div className="relative aspect-square max-h-48 sm:max-h-80 rounded-xl overflow-hidden">
                        <Image
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded image"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={() => {
                            setUploadedImage(null)
                            setGeneratedImage(null)
                            setGeneratedImages([])
                            setGenerationCount(0)
                            setSelectedImageIndex(null)
                          }}
                          className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
                          aria-label="Remove uploaded image"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Preview Section */}
                  <div className="space-y-2">
                    <p className="text-white/60 text-sm">Transformed Preview</p>
                    <div className="relative aspect-square max-h-48 sm:max-h-80 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
                      {generatedImage ? (
                        <Image
                          src={generatedImage || "/placeholder.svg"}
                          alt="Generated preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="text-center text-white/40">
                          <span className="text-3xl sm:text-4xl block mb-2" aria-hidden="true">
                            ✨
                          </span>
                          <span className="text-xs sm:text-sm">Your transformed image will appear here</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generated Images Gallery */}
                  {generatedImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white/60 text-sm">
                        All Generations ({generatedImages.length}/{MAX_GENERATIONS})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {generatedImages.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setGeneratedImage(img)
                              setSelectedImageIndex(index)
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                              ? "border-green-400 ring-2 ring-green-400/50"
                              : "border-white/20 hover:border-white/40"
                              }`}
                            aria-label={`Select generation ${index + 1}`}
                            aria-pressed={selectedImageIndex === index}
                          >
                            <Image
                              src={img || "/placeholder.svg"}
                              alt={`Generation ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {selectedImageIndex === index && (
                              <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                                <span className="text-white text-xl" aria-hidden="true">
                                  ✓
                                </span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Style Selection, Custom Prompt, and Add Text */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">2. Choose a Style</h3>

                  {/* Category tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {PRESET_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${selectedCategory === category.id
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
                          }`}
                        aria-label={`Select ${category.name} category`}
                        aria-pressed={selectedCategory === category.id}
                      >
                        <span className="mr-2" aria-hidden="true">
                          {category.icon}
                        </span>
                        {category.name}
                      </button>
                    ))}
                  </div>

                  {/* Presets grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {PRESET_CATEGORIES.find((cat) => cat.id === selectedCategory)?.presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedPreset(preset.id)
                          setCustomPrompt("")
                        }}
                        className={`p-3 sm:p-4 rounded-xl border transition-all text-left ${selectedPreset === preset.id
                          ? "bg-white/20 border-white/50"
                          : "bg-white/5 border-white/10 hover:border-white/30"
                          }`}
                        aria-label={`Select ${preset.name} style`}
                        aria-pressed={selectedPreset === preset.id}
                      >
                        <span className="text-xl sm:text-2xl block mb-1 sm:mb-2" aria-hidden="true">
                          {preset.icon}
                        </span>
                        <span className="text-white font-medium text-xs sm:text-sm">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-gradient-to-br from-red-950 to-green-950 px-3 text-white/40 text-sm">or</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="custom-prompt-transform" className="text-white/80 text-sm">
                      Custom Prompt
                    </Label>
                    <Input
                      id="custom-prompt-transform"
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value)
                        setSelectedPreset(null)
                      }}
                      placeholder="Describe your transformation..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      aria-describedby="custom-prompt-help"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3">3. Add Text (Optional)</h3>
                    <Label htmlFor="overlay-text-transform" className="text-white/80 text-sm">
                      Text to display on image
                    </Label>
                    <Textarea
                      id="overlay-text-transform"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="e.g., Merry Christmas! Happy Holidays! Season's Greetings..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                      rows={2}
                      aria-describedby="overlay-text-help"
                    />
                    <p id="overlay-text-help" className="text-white/40 text-xs mt-1">
                      Leave empty for no text overlay
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleTransform}
                  disabled={
                    isGenerating ||
                    !uploadedImage ||
                    (!selectedPreset && !customPrompt) ||
                    generationCount >= MAX_GENERATIONS
                  }
                  className="flex-1 bg-gradient-to-r from-red-600 to-green-600 hover:from-red-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Transform image (${generationCount}/${MAX_GENERATIONS} used)`}
                >
                  {isGenerating
                    ? "Transforming..."
                    : generationCount >= MAX_GENERATIONS
                      ? "Limit Reached"
                      : `Transform Image (${generationCount}/${MAX_GENERATIONS})`}
                </Button>
                {generatedImages.length > 0 && (
                  <Button
                    onClick={handleUseImage}
                    className="bg-white text-black hover:bg-white/90"
                    aria-label="Use selected image for your beam"
                  >
                    Use This Image
                  </Button>
                )}
              </div>
              {generationCount > 0 && (
                <p className="text-white/60 text-sm text-center" role="status">
                  Generations used: {generationCount} / {MAX_GENERATIONS}
                </p>
              )}
            </div>
          )}

          {/* We Create Mode */}
          {mode === "we-create" && (
            <div className="space-y-4 sm:space-y-6">
              <Button
                onClick={() => setMode("choose")}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                aria-label="Go back to mode selection"
              >
                ← Back
              </Button>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-4 sm:gap-6">
                {/* Left: Preview Section */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">Preview</h3>
                  <div className="relative aspect-square max-h-48 sm:max-h-80 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
                    {generatedImage ? (
                      <Image
                        src={generatedImage || "/placeholder.svg"}
                        alt="Generated postcard preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-center text-white/40">
                        <span className="text-3xl sm:text-4xl block mb-2" aria-hidden="true">
                          🎄
                        </span>
                        <span className="text-xs sm:text-sm">Your AI creation will appear here</span>
                      </div>
                    )}
                  </div>

                  {/* Generated Images Gallery */}
                  {generatedImages.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-white/60 text-sm">
                        All Generations ({generatedImages.length}/{MAX_GENERATIONS})
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {generatedImages.map((img, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setGeneratedImage(img)
                              setSelectedImageIndex(index)
                            }}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                              ? "border-green-400 ring-2 ring-green-400/50"
                              : "border-white/20 hover:border-white/40"
                              }`}
                            aria-label={`Select generation ${index + 1}`}
                            aria-pressed={selectedImageIndex === index}
                          >
                            <Image
                              src={img || "/placeholder.svg"}
                              alt={`Generation ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            {selectedImageIndex === index && (
                              <div className="absolute inset-0 bg-green-400/20 flex items-center justify-center">
                                <span className="text-white text-xl" aria-hidden="true">
                                  ✓
                                </span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Style Selection, Custom Prompt, and Add Text */}
                <div className="space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-white">1. Choose a Theme</h3>

                  {/* Category tabs */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {PRESET_CATEGORIES.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${selectedCategory === category.id
                          ? "bg-white/20 text-white border border-white/30"
                          : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white/80"
                          }`}
                        aria-label={`Select ${category.name} category`}
                        aria-pressed={selectedCategory === category.id}
                      >
                        <span className="mr-2" aria-hidden="true">
                          {category.icon}
                        </span>
                        {category.name}
                      </button>
                    ))}
                  </div>

                  {/* Presets grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {PRESET_CATEGORIES.find((cat) => cat.id === selectedCategory)?.presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setSelectedPreset(preset.id)
                          setCustomPrompt("")
                        }}
                        className={`p-3 sm:p-4 rounded-xl border transition-all text-left ${selectedPreset === preset.id
                          ? "bg-white/20 border-white/50"
                          : "bg-white/5 border-white/10 hover:border-white/30"
                          }`}
                        aria-label={`Select ${preset.name} theme`}
                        aria-pressed={selectedPreset === preset.id}
                      >
                        <span className="text-xl sm:text-2xl block mb-1 sm:mb-2" aria-hidden="true">
                          {preset.icon}
                        </span>
                        <span className="text-white font-medium text-xs sm:text-sm">{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="relative ">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center ">
                      <span className="rounded-lg bg-gradient-to-br from-primary to-destructive px-3 text-white text-sm">or</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="custom-prompt-generate" className="text-white/80 text-sm">
                      Custom Prompt
                    </Label>
                    <Input
                      id="custom-prompt-generate"
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value)
                        setSelectedPreset(null)
                      }}
                      placeholder="Describe your dream postcard..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-3">2. Add Text (Optional)</h3>
                    <Label htmlFor="overlay-text-generate" className="text-white/80 text-sm">
                      Text to display on image
                    </Label>
                    <Textarea
                      id="overlay-text-generate"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="e.g., Merry Christmas! Happy Holidays! Season's Greetings..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                      rows={2}
                      aria-describedby="overlay-text-generate-help"
                    />
                    <p id="overlay-text-generate-help" className="text-white/40 text-xs mt-1">
                      Leave empty for no text overlay
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!selectedPreset && !customPrompt)}
                  className="flex-1 bg-gradient-to-r from-primary to-destructive "
                  aria-label="Generate postcard with AI"
                >
                  {isGenerating ? "Creating Magic..." : "Generate Postcard"}
                </Button>
                {generatedImage && (
                  <Button
                    onClick={handleUseImage}
                    className="bg-white text-black hover:bg-white/90"
                    aria-label="Use generated image for your beam"
                  >
                    Use This Image
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
