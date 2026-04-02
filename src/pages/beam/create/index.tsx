"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import {
    Mail,
    ExternalLink,
    Copy,
    Check,
    Home,
    Send,
    History,
    Settings,
    HelpCircle,
    Gift,
    Video,
    MessageSquare,
    Wand2,
    Menu,
    X,
    Loader2,
    Palette,
    Info,
} from "lucide-react"
import { Button } from "~/components/shadcn/ui/button"
import { Input } from "~/components/shadcn/ui/input"
import { Textarea } from "~/components/shadcn/ui/textarea"
import { Label } from "~/components/shadcn/ui/label"
// </CHANGE> Removed uploadVideo import - using API route instead
import { VibeStudio } from "~/components/modal/vibe-studio"

import Link from "next/link"
import { Alert, AlertDescription } from "~/components/shadcn/ui/alert"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/shadcn/ui/dropdown-menu"
import { Preset, PresetSidebar } from "~/components/common/preset-sidebar"
import BeamLayout from "~/components/layout/beam-layout"
import { UploadS3Button } from "~/components/common/upload-button"
import toast from "react-hot-toast"
import { generateImage } from "~/pages/api/generate-image"
import PreviewModal from "~/components/modal/preview-modal"
import { api } from "~/utils/api"
import { PaymentChoose, usePaymentMethodStore } from "~/components/common/payment-options"
import useNeedSign from "~/lib/hook"
import { PLATFORM_FEE, TrxBaseFeeInPlatformAsset } from "~/lib/stellar/constant"
import { clientSelect } from "~/lib/stellar/fan/utils"
import { clientsign } from "package/connect_wallet"
import { useSession } from "next-auth/react"
import { BeamType } from "@prisma/client"

export const BEAM_COST = 400

export function CreateBeamForm() {
    const session = useSession()
    const router = useRouter()
    const { needSign } = useNeedSign()
    const [beamType, setBeamType] = useState<BeamType>("POSTCARD")
    const [formData, setFormData] = useState({
        recipientName: "",
        message: "",
        senderName: "",
        enableAR: false,
    })
    const [uploadedVideo, setUploadedVideo] = useState<string | undefined>(undefined)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [showPreview, setShowPreview] = useState(false)

    const [isGenerating, setIsGenerating] = useState(false)

    const [imagePrompt, setImagePrompt] = useState("")
    const [generatedImage, setGeneratedImage] = useState<string | undefined>(undefined)
    const [isGeneratingImage, setIsGeneratingImage] = useState(false)
    const [imageError, setImageError] = useState<string | null>(null)
    const [videoUploadProgress, setVideoUploadProgress] = useState(0)
    const [showVibeStudio, setShowVibeStudio] = useState(false)


    const [theme, setTheme] = useState<"default" | "christmas" | "new-year" | "hanukkah">("new-year")
    const totalFees = Number(TrxBaseFeeInPlatformAsset) + Number(PLATFORM_FEE)


    const GenerateAIResponse = api.beam.gererateAIResponse.useMutation(
        {
            onSuccess: (result) => {
                setIsGenerating(false)
                console.log("AI Generation success:", result)
                setGeneratedImage(result.url)
            }
            ,
            onError: (error) => {
                setIsGenerating(false)
                console.error("AI Generation error caught:", error)
                setImageError(error.message)
            }
        }
    )
    const handleGenerateImage = async () => {
        if (!imagePrompt) {
            setImageError("Please enter a prompt for the AI image.")
            return
        }

        setIsGeneratingImage(true)

        GenerateAIResponse.mutate({ prompt: imagePrompt })
    }
    const handleVibeStudioImage = (imageUrl: string) => {
        setGeneratedImage(imageUrl)
        setShowVibeStudio(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.recipientName || !formData.senderName) {
            return
        }

        if (beamType === "MESSAGE" && !formData.message) {
            toast.error("Please enter a message for your beam.")
            return;
        }

        if (beamType === "VIDEO" && !uploadedVideo) {
            setUploadError("Please upload a video first")
            return
        }

        if ((beamType === "POSTCARD" || beamType === "AI") && !generatedImage) {
            setUploadError("Please generate an image first")
            return
        }
        setShowPreview(true)

    }
    const createBeamMutation = api.beam.create.useMutation({
        onSuccess: (data) => {
            setShowPreview(false)
            toast.success("Beam created successfully!")
            router.push(`/beam/${data.id}`)
        },
        onError: (error) => {
            toast.error(`Error creating beam: ${error.message}`)
        },
    })

    const CreateBeamXDR = api.beam.createBeamXDR.useMutation({
        onSuccess: (xdr) => {
            if (xdr) {
                clientsign({
                    presignedxdr: xdr,
                    pubkey: session.data?.user.id,
                    walletType: session.data?.user.walletType,
                    test: clientSelect(),
                })
                    .then((res) => {
                        if (res) {
                            createBeamMutation.mutate({
                                type: beamType,
                                senderName: formData.senderName,
                                recipientName: formData.recipientName,
                                message: formData.message,
                                contentUrl: beamType === "VIDEO" ? uploadedVideo : generatedImage,
                                customPrompt: imagePrompt,
                                arEnabled: formData.enableAR,
                                isPublic: true,
                            })
                        }
                    })
                    .catch((e) => console.log(e))
                    .finally(() => {
                        console.log("completed");
                    });

            }


        }
    })



    return (
        <BeamLayout>
            <div className="flex justify-center w-full  py-6 lg:py-8  lg:px-8  overflow-y-auto  ">
                <div className="w-full max-w-md lg:max-w-3xl">
                    {/* Glass Panel Container */}
                    <div className="glass-panel rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-xl border border-white/10 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                        {/* Header Section */}
                        <div className="mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Create a Beam</h2>
                            <p className="text-sm text-slate-300">Choose how you want to spread joy</p>
                        </div>

                        {/* Message Type Selector */}
                        <div className="mb-8">
                            <Label htmlFor="message-type" className="text-white mb-3 block text-sm font-semibold uppercase tracking-wide">
                                Message Type
                            </Label>
                            <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="message-type">
                                {[
                                    {
                                        type: "MESSAGE",
                                        icon: theme === "new-year" ? "🎊" : theme === "hanukkah" ? "💬" : "🎅",
                                        label: "Text",
                                        disabled: false,
                                    },
                                    {
                                        type: "VIDEO",
                                        icon: theme === "new-year" ? "🎆" : theme === "hanukkah" ? "🕎" : "🎄",
                                        label: "Video",
                                        disabled: false,
                                    },
                                    {
                                        type: "POSTCARD",
                                        icon: theme === "new-year" ? "🥂" : theme === "hanukkah" ? "✡️" : "🎁",
                                        label: "Card",
                                        disabled: false,
                                    },
                                    {
                                        type: "AI",
                                        icon: theme === "new-year" ? "✨" : theme === "hanukkah" ? "🕯️" : "⛄",
                                        label: "AI",
                                        disabled: false,
                                    },
                                ].map(({ type, label, disabled, icon }) => {
                                    const isDisabled = disabled

                                    return (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => !isDisabled && setBeamType(type as BeamType)}
                                            disabled={isDisabled}
                                            aria-label={`${label} beam type${isDisabled ? " (coming soon)" : ""}`}
                                            aria-pressed={!isDisabled && beamType === type}
                                            aria-disabled={isDisabled}
                                            className={`group relative p-3 rounded-2xl border-2 transition-all duration-200 ${isDisabled
                                                ? "border-slate-700/50 bg-slate-800/30 opacity-50 cursor-not-allowed"
                                                : beamType === type
                                                    ? "border-red-500/80 bg-gradient-to-br from-red-500/25 to-orange-500/15 shadow-lg shadow-red-500/20"
                                                    : "border-slate-700/50 bg-slate-800/20 hover:border-red-400/60 hover:bg-red-900/20 hover:shadow-lg hover:shadow-red-500/10"
                                                }`}
                                        >
                                            {isDisabled && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl" aria-hidden="true">
                                                    <span className="text-[8px] text-white/90 font-semibold px-1">COMING SOON</span>
                                                </div>
                                            )}
                                            <div className="text-2xl mx-auto mb-1 group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
                                                {icon}
                                            </div>
                                            <div className="text-xs text-slate-300 font-medium group-hover:text-white transition-colors duration-200">{label}</div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {showPreview && (
                            <PreviewModal
                                isOpen={showPreview}
                                onClose={() => setShowPreview(false)}
                                onConfirm={() => CreateBeamXDR.mutate({
                                    signWith: needSign(),
                                    amount: BEAM_COST + totalFees,
                                })}
                                beamData={{
                                    recipientName: formData.recipientName,
                                    senderName: formData.senderName,
                                    message: formData.message,
                                    beamType,
                                    generatedImage,
                                    uploadedVideo,
                                }}
                            />
                        )}

                        {/* Form Section */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Recipients Section */}
                            <div className="space-y-4 pb-4 border-b border-slate-700/50">
                                <div>
                                    <Label htmlFor="recipient-name" className="text-white text-sm font-semibold mb-2 block">
                                        Recipient Name{" "}
                                        <span className="text-red-400" aria-label="required">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="recipient-name"
                                        value={formData.recipientName}
                                        onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                        placeholder="Who is this for?"
                                        className="glass-input  placeholder:text-slate-400/70 mt-1 focus:border-red-400/50 focus:ring-red-500/20 transition-all duration-200"
                                        required
                                        aria-required="true"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="sender-name" className="text-white text-sm font-semibold mb-2 block">
                                        Your Name{" "}
                                        <span className="text-red-400" aria-label="required">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="sender-name"
                                        value={formData.senderName}
                                        onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                        placeholder="From..."
                                        className="glass-input  placeholder:text-slate-400/70 mt-1 focus:border-red-400/50 focus:ring-red-500/20 transition-all duration-200"
                                        required
                                        aria-required="true"
                                    />
                                </div>
                            </div>

                            {beamType === "MESSAGE" && (
                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="text-message" className="text-white text-sm font-semibold mb-2 block">
                                            Text Message {" "}
                                            <span className="text-red-400" aria-label="required">
                                                *
                                            </span>
                                        </Label>
                                        <Textarea
                                            id="text-message"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Write your heartfelt message..."
                                            className="glass-input  placeholder:text-slate-400/70 min-h-[100px] mt-1 focus:border-red-400/50 focus:ring-red-500/20 transition-all duration-200 resize-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                                        <input
                                            type="checkbox"
                                            id="enable-ar"
                                            checked={!!formData.enableAR}
                                            onChange={(e) => setFormData({ ...formData, enableAR: e.target.checked })}
                                            className="h-4 w-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                                        />
                                        <label htmlFor="enable-ar" className="text-sm text-slate-200 font-medium cursor-pointer flex-1">
                                            Enable AR Experience
                                        </label>
                                        <span className="text-xs text-slate-400">Optional</span>
                                    </div>
                                </div>
                            )}

                            {beamType === "VIDEO" && (
                                <div className="space-y-5">
                                    <Alert className="border-amber-600/40 bg-amber-500/10 rounded-2xl">
                                        <Info className="h-5 w-5 text-amber-400" />
                                        <AlertDescription className="text-sm text-amber-200 ml-2">
                                            <strong>Max 1 GB.</strong> Compress larger videos with HandBrake or an online compressor.
                                        </AlertDescription>
                                    </Alert>
                                    <UploadS3Button
                                        id='videoFileInput'
                                        className="hidden"
                                        endpoint="videoUploader"
                                        onUploadProgress={(progress) => {
                                            setVideoUploadProgress(progress)
                                            setIsUploading(true)
                                        }}
                                        onClientUploadComplete={async (res) => {
                                            const data = res
                                            if (data?.url) {
                                                setUploadedVideo(data.url)
                                            }
                                            setIsUploading(false)
                                            setVideoUploadProgress(0)
                                            toast.success("Video uploaded successfully!")
                                        }}
                                        onUploadError={(error: Error) => {
                                            console.log("ERROR UPLOADING: ", error)
                                            setIsUploading(false)
                                            setVideoUploadProgress(0)
                                            toast.error("Upload failed!")
                                        }}
                                    />
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="video-upload" className="text-white text-sm font-semibold mb-3 block">
                                                Upload Your Video
                                            </Label>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full relative overflow-hidden bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-400/30 hover:border-red-400/60 hover:bg-red-500/15 text-white hover:text-white transition-all duration-200"
                                                disabled={isUploading}
                                                onClick={() => document.getElementById("videoFileInput")?.click()}
                                                aria-describedby="video-upload-description"
                                            >
                                                {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                                {isUploading ? "Uploading..." : uploadedVideo ? "Change Video" : "Choose Video"}
                                            </Button>
                                            <span id="video-upload-description" className="sr-only">
                                                Upload a video file up to 1GB. For larger files, compress them using video compression tools before uploading.
                                            </span>
                                        </div>

                                        {isUploading && (
                                            <div className="space-y-2">
                                                <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 shadow-lg shadow-red-500/50 transition-all duration-300"
                                                        style={{ width: `${videoUploadProgress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 text-right">{videoUploadProgress}%</p>
                                            </div>
                                        )}

                                        {uploadedVideo && (
                                            <div className="rounded-2xl overflow-hidden shadow-lg">
                                                <video
                                                    src={uploadedVideo}
                                                    controls
                                                    className="w-full max-h-64 bg-black"
                                                />
                                            </div>
                                        )}

                                        {uploadError && (
                                            <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/40" role="alert">
                                                <p className="text-red-300 text-sm">
                                                    <strong>Upload Error:</strong> {uploadError}
                                                </p>
                                            </div>
                                        )}

                                        {uploadedVideo && (
                                            <div>
                                                <Label htmlFor="video-caption" className="text-white text-sm font-semibold mb-2 block">
                                                    Add a Message <span className="text-slate-300 font-normal">(optional)</span>
                                                </Label>
                                                <Textarea
                                                    id="video-caption"
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                    placeholder="Add a heartfelt caption..."
                                                    className="glass-input  placeholder:text-slate-400/70 min-h-[80px] focus:border-red-400/50 focus:ring-red-500/20 transition-all duration-200 resize-none"
                                                />
                                            </div>
                                        )}

                                        {uploadedVideo && (
                                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                                                <input
                                                    type="checkbox"
                                                    id="enable-ar-video"
                                                    checked={!!formData.enableAR}
                                                    onChange={(e) => setFormData({ ...formData, enableAR: e.target.checked })}
                                                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                                                />
                                                <label htmlFor="enable-ar-video" className="text-sm text-slate-200 font-medium cursor-pointer flex-1">
                                                    Enable AR Experience
                                                </label>
                                                <span className="text-xs text-slate-400">Optional</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {beamType === "POSTCARD" && (
                                <div className="space-y-5">
                                    <div>
                                        <Label className="text-white text-sm font-semibold mb-3 block">
                                            Create Your Postcard{" "}
                                            <span className="text-red-400" aria-label="required">
                                                *
                                            </span>
                                        </Label>
                                        <Button
                                            type="button"
                                            onClick={() => setShowVibeStudio(true)}
                                            className="w-full bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl py-6"
                                            aria-label="Open VibeStudio to create postcard"
                                        >
                                            <Wand2 className="w-5 h-5 mr-2" aria-hidden="true" />
                                            Open VibeStudio
                                        </Button>
                                    </div>

                                    {generatedImage && (
                                        <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10">
                                            <Image
                                                src={generatedImage || "/placeholder.svg"}
                                                alt="Generated postcard preview"
                                                width={300}
                                                height={200}
                                                className="w-full h-auto"
                                                priority
                                            />
                                        </div>
                                    )}

                                    {generatedImage && (
                                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-colors duration-200">
                                            <input
                                                type="checkbox"
                                                id="enable-ar-postcard"
                                                checked={!!formData.enableAR}
                                                onChange={(e) => setFormData({ ...formData, enableAR: e.target.checked })}
                                                className="h-4 w-4 rounded border-slate-600 bg-slate-700 cursor-pointer"
                                            />
                                            <label htmlFor="enable-ar-postcard" className="text-sm text-slate-200 font-medium cursor-pointer flex-1">
                                                Enable AR Experience
                                            </label>
                                            <span className="text-xs text-slate-400">Optional</span>
                                        </div>
                                    )}
                                    <div className="mt-3">
                                        <Label htmlFor="card-message" className="text-white text-sm">
                                            Card Message (Optional)
                                        </Label>
                                        <Textarea
                                            id="card-message"
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            placeholder="Add a message to your card... (you can add this later too)"
                                            className="glass-input  placeholder:text-slate-400 min-h-[80px] lg:min-h-[100px] mt-1"
                                        />
                                    </div>
                                </div>
                            )}

                            {beamType === "AI" && (
                                <div>
                                    <Label htmlFor="ai-prompt" className="text-white text-sm">
                                        AI Art Prompt{" "}
                                        <span className="text-red-400" aria-label="required">
                                            *
                                        </span>
                                    </Label>
                                    <Textarea
                                        id="ai-prompt"
                                        value={imagePrompt}
                                        onChange={(e) => setImagePrompt(e.target.value)}
                                        placeholder="Describe your holiday art..."
                                        className="glass-input text-white placeholder:text-slate-400 min-h-[60px] mt-1"
                                        required={beamType === "AI"}
                                        aria-required={beamType === "AI"}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleGenerateImage}
                                        disabled={isGeneratingImage || !imagePrompt}
                                        className="w-full mt-2 bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 text-white"
                                        aria-label="Generate AI art from prompt"
                                    >
                                        {isGeneratingImage ? "Generating..." : "Generate AI Art"}
                                    </Button>
                                    {imageError && (
                                        <p className="text-red-400 text-xs mt-1" role="alert">
                                            {imageError}
                                        </p>
                                    )}
                                    {generatedImage && (
                                        <div className="mt-2 rounded-lg overflow-hidden">
                                            <Image
                                                src={generatedImage || "/placeholder.svg"}
                                                alt="Generated AI art preview"
                                                width={300}
                                                height={200}
                                                className="w-full h-auto"
                                            />
                                        </div>
                                    )}
                                    {generatedImage && (
                                        <div>
                                            <Label htmlFor="ai-message" className="text-white text-sm font-semibold mb-2 block">
                                                Add a Message <span className="text-slate-300 font-normal">(optional)</span>
                                            </Label>
                                            <Textarea
                                                id="ai-message"
                                                value={formData.message}
                                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                placeholder="Add a heartfelt message..."
                                                className="glass-input text-white placeholder:text-slate-400/70 min-h-[80px] focus:border-red-400/50 focus:ring-red-500/20 transition-all duration-200 resize-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submit Button Section */}
                            <div className="pt-4 border-t border-slate-700/50">
                                <Button
                                    type="submit"
                                    disabled={
                                        isGenerating ||
                                        !formData.recipientName ||
                                        !formData.senderName ||
                                        (beamType === "VIDEO" && !uploadedVideo) ||
                                        ((beamType === "POSTCARD" || beamType === "AI") && !generatedImage)
                                    }
                                    className="w-full bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                                            Creating Beam...
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg mr-2" aria-hidden="true">
                                                {theme === "new-year" ? "✨" : theme === "hanukkah" ? "🕯️" : "⛄"}
                                            </span>
                                            Send Beam
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
                {showVibeStudio && (
                    <VibeStudio onSelectImage={handleVibeStudioImage} onClose={() => setShowVibeStudio(false)} />
                )}
            </div>
        </BeamLayout>
    )
}

export default CreateBeamForm
