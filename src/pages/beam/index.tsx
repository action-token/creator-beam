"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
    Sparkles,
    LayoutGrid,
    Plus,
} from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import { Textarea } from "~/components/shadcn/ui/textarea";
import { Label } from "~/components/shadcn/ui/label";
// </CHANGE> Removed uploadVideo import - using API route instead
import { VibeStudio } from "~/components/modal/vibe-studio";
import { CreateBeamForm } from "~/pages/creator/beam/create";

import Link from "next/link";
import { Alert, AlertDescription } from "~/components/shadcn/ui/alert";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { Preset, PresetSidebar } from "~/components/common/preset-sidebar";
import BeamLayout from "~/components/layout/beam-layout";
import { getCookie } from "cookies-next";

const LAYOUT_MODE_COOKIE = "beam-layout-mode";

export function BeamHomePageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("modern");

    useEffect(() => {
        const storedMode = getCookie(LAYOUT_MODE_COOKIE);
        if (storedMode === "legacy" || storedMode === "modern") {
            setLayoutMode(storedMode);
        }
    }, []);

    const [showForm, setShowForm] = useState(false);
    const [activeSection, setActiveSection] = useState<
        "home" | "create" | "history" | "gallery" | "help"
    >("home");
    const [beamType, setBeamType] = useState<
        "message" | "video" | "postcard" | "ai-image"
    >("postcard");
    const [formData, setFormData] = useState({
        recipientName: "",
        message: "",
        senderName: "",
        enableAR: false,
    });
    const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const [copySuccess, setCopySuccess] = useState<"link" | "email" | null>(null);

    const [imagePrompt, setImagePrompt] = useState("");
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const [postcardStyle, setPostcardStyle] = useState<string>("vintage");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showVibeStudio, setShowVibeStudio] = useState(false);

    const [customization, setCustomization] = useState({
        textColor: "#00d9ff",
        textSize: "medium" as "small" | "medium" | "large",
        animationStyle: "float" as "float" | "spin" | "pulse" | "wave",
        backgroundEffect: "particles" as "particles" | "stars" | "grid" | "none",
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [userBeamCount, setUserBeamCount] = useState<number | null>(null);
    const [createdBeamId, setCreatedBeamId] = useState<string | null>(null);
    const [beamUrl, setBeamUrl] = useState<string | null>(null);

    const [pendingBeamId, setPendingBeamId] = useState<string | null>(null);

    const [currentShareToken, setCurrentShareToken] = useState<string | null>(
        null,
    );

    const [showPreview, setShowPreview] = useState(false);

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 50 * 1024 * 1024; // 50MB limit
        if (file.size > maxSize) {
            setUploadError(
                "File size exceeds 50MB limit. Please choose a smaller video or compress it first.",
            );
            return;
        }

        if (!file.type.startsWith("video/")) {
            setUploadError("Please upload a valid video file.");
            return;
        }

        setUploadError(null);
        setIsUploading(true);

        try {
            console.log(
                "[v0] Uploading directly to Vercel Blob using client upload...",
            );
        } catch (error) {
            console.error("[v0] Upload error:", error);
            if (error instanceof Error) {
                setUploadError(error.message);
            } else {
                setUploadError("Upload failed. Please try again.");
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt) {
            setImageError("Please enter a prompt for the AI image.");
            return;
        }

        setIsGeneratingImage(true);
    };

    const handleVibeStudioImage = (imageUrl: string) => {
        setGeneratedImage(imageUrl);
        setShowVibeStudio(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.recipientName || !formData.senderName) {
            return;
        }

        if (beamType === "message" && !formData.message) {
            // alert("Please enter a text message.") // This alert is no longer needed as text message is optional
            // If we want to enforce a message for the 'message' type, uncomment the alert above.
            // For now, an empty message is allowed for the 'message' type.
        }

        if (beamType === "video" && !uploadedVideo) {
            setUploadError("Please upload a video first");
            return;
        }

        if (
            (beamType === "postcard" || beamType === "ai-image") &&
            !generatedImage
        ) {
            setUploadError("Please generate an image first");
            return;
        }

        setShowPreview(true);
    };

    const handlePresetSelect = (preset: Preset) => {
        setSelectedPreset(preset);
        if (beamType !== "postcard" && beamType !== "ai-image") {
            setBeamType("postcard");
        }
        setActiveSection("create");
        setShowForm(true);
    };

    const handleCreateBeam = () => {
        router.push("/beam/create");
    };

    if (layoutMode === "modern") {
        return (
            <div className="relative flex h-[calc(100vh-10.8vh)] w-full flex-col gap-4 overflow-y-auto px-3 pt-4 scrollbar-hide md:mx-auto md:w-[85vw] md:px-0">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">BEAM Messages</h1>
                    <Button
                        onClick={() => router.push("/beam/create")}
                        className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600"
                    >
                        <Plus className="h-4 w-4" />
                        Create Beam
                    </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <button
                        onClick={() => router.push("/beam/create")}
                        className="flex h-48 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary/30 bg-background/50 p-4 text-center transition-all hover:border-primary/50 hover:bg-accent/50"
                    >
                        <div className="rounded-full bg-primary/10 p-3">
                            <Plus className="h-6 w-6 text-primary" />
                        </div>
                        <span className="font-medium text-primary">Create New Beam</span>
                    </button>

                    <button
                        onClick={() => router.push("/beam/create")}
                        className="group relative flex h-48 flex-col rounded-xl border border-border/50 bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-4 text-left transition-all hover:border-cyan-500/30 hover:scale-[1.02]"
                    >
                        <div className="mb-3 flex items-start justify-between">
                            <div className="text-3xl">📧</div>
                            <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                                AR/QR
                            </span>
                        </div>
                        <h3 className="mb-1 text-lg font-bold text-foreground group-hover:text-cyan-400">
                            BEAM Messages
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Send personalized messages with AR experiences
                        </p>
                    </button>

                    <button
                        onClick={() => router.push("/beam/create")}
                        className="group relative flex h-48 flex-col rounded-xl border border-border/50 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 p-4 text-left transition-all hover:border-purple-500/30 hover:scale-[1.02]"
                    >
                        <div className="mb-3 flex items-start justify-between">
                            <div className="text-3xl">🤖</div>
                            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                                AI
                            </span>
                        </div>
                        <h3 className="mb-1 text-lg font-bold text-foreground group-hover:text-purple-400">
                            BEAM Studio
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Generate AI-powered images
                        </p>
                    </button>

                    <button
                        onClick={() => router.push("/beam/gallery")}
                        className="group relative flex h-48 flex-col rounded-xl border border-border/50 bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-4 text-left transition-all hover:border-green-500/30 hover:scale-[1.02]"
                    >
                        <div className="mb-3 flex items-start justify-between">
                            <div className="text-3xl">🖼️</div>
                            <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300">
                                Gallery
                            </span>
                        </div>
                        <h3 className="mb-1 text-lg font-bold text-foreground group-hover:text-green-400">
                            My Gallery
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            View your created beams
                        </p>
                    </button>
                </div>

                <div className="mt-6">
                    <h2 className="mb-4 text-xl font-semibold text-foreground">Recent Messages</h2>
                    <div className="rounded-xl border border-border/50 bg-card p-8 text-center">
                        <p className="text-muted-foreground">No messages yet. Create your first BEAM!</p>
                        <Button
                            onClick={() => router.push("/beam/create")}
                            className="mt-4 gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create Message
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <BeamLayout>
            <div className=" relative flex w-full flex-col  overflow-hidden bg-gradient-to-b from-gray-900 via-black to-black">
                <main
                    id="main-content"
                    className="flex-1 p-3 lg:overflow-y-auto lg:p-6"
                    aria-label="Main content"
                >
                    <div className="flex-1 overflow-y-auto">
                        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
                            <div className="flex w-full max-w-6xl items-center justify-center">
                                <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-2">
                                    <div className="space-y-6 text-center lg:text-left">
                                        <h1 className="text-balance text-5xl font-bold leading-tight text-white lg:text-6xl">
                                            The Complete Platform for
                                            <br />
                                            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                                                Modern Communication
                                            </span>
                                        </h1>
                                        <p className="text-pretty text-xl text-slate-200">
                                            Send multi-channel messages, analyze documents with AI,
                                            and manage events—all in one powerful platform
                                        </p>
                                        <div className="glass-card rounded-xl border-cyan-500/30 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 p-4">
                                            <p className="mb-1 text-sm font-medium text-cyan-200">
                                                📲 One platform, endless possibilities
                                            </p>
                                            <p className="text-pretty text-xs text-slate-300">
                                                Multi-channel messaging, AI-powered document analysis,
                                                and complete event management in a single integrated
                                                platform.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => handleCreateBeam()}
                                            size="lg"
                                            className="rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 px-8 py-6 text-lg font-semibold text-white shadow-2xl hover:from-cyan-500 hover:via-blue-500 hover:to-cyan-600"
                                            aria-label="Create your first message"
                                        >
                                            <span className="mr-2 text-xl" aria-hidden="true">
                                                ✨
                                            </span>
                                            Get Started
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <button
                                            onClick={() => handleCreateBeam()}
                                            className="glass-card w-full rounded-2xl border-cyan-500/30 bg-gradient-to-br from-cyan-900/40 to-blue-800/40 p-6 text-left transition-all hover:scale-[1.02] hover:border-cyan-400/50"
                                            aria-label="Go to BEAM Messages"
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="text-4xl" aria-hidden="true">
                                                    📧
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                                                        Email
                                                    </span>
                                                    <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                                                        Text
                                                    </span>
                                                    <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                                                        AR
                                                    </span>
                                                    <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300">
                                                        QR
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="mb-2 text-xl font-bold text-white">
                                                BEAM Messages
                                            </h3>
                                            <p className="mb-3 text-sm text-slate-300">
                                                Send personalized messages with AR experiences, QR
                                                codes, and more. Perfect for celebrations and everyday
                                                moments.
                                            </p>
                                            <div className="text-sm font-medium text-cyan-400">
                                                Create Message →
                                            </div>
                                        </button>
                                        <button
                                            className="glass-card w-full rounded-2xl border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-indigo-800/40 p-6 text-left transition-all hover:scale-[1.02] hover:border-purple-400/50"
                                            aria-label="Go to BEAM Studio"
                                            disabled
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="text-4xl" aria-hidden="true">
                                                    🤖
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                                                        AI Chat
                                                    </span>
                                                    <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                                                        Infographics
                                                    </span>
                                                    <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs text-purple-300">
                                                        Analysis
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="mb-2 text-xl font-bold text-white">
                                                BEAM Studio
                                            </h3>
                                            <p className="mb-3 text-sm text-slate-300">
                                                Upload documents and chat with AI to get insights,
                                                summaries, and generate professional infographics from
                                                your content.
                                            </p>
                                            <div className="text-sm font-medium text-purple-400">
                                                Open Studio →
                                            </div>
                                        </button>
                                        <button
                                            className="glass-card w-full rounded-2xl border-green-500/30 bg-gradient-to-br from-green-900/40 to-emerald-800/40 p-6 text-left transition-all hover:scale-[1.02] hover:border-green-400/50"
                                            aria-label="Go to BEAM Events"
                                            disabled
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="text-4xl" aria-hidden="true">
                                                    🎫
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300">
                                                        RSVPs
                                                    </span>
                                                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300">
                                                        Ticketing
                                                    </span>
                                                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300">
                                                        Surveys
                                                    </span>
                                                </div>
                                            </div>
                                            <h3 className="mb-2 text-xl font-bold text-white">
                                                BEAM Events
                                            </h3>
                                            <p className="mb-3 text-sm text-slate-300">
                                                Complete event CRM with RSVP tracking, guest management,
                                                custom surveys, ticketing, and targeted messaging
                                                capabilities.
                                            </p>
                                            <div className="text-sm font-medium text-green-400">
                                                Manage Events →
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </BeamLayout>
    );
}

export default BeamHomePageClient;
