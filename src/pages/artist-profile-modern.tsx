"use client"

import React, { useEffect } from "react"
import { useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/router"
import {
    ImageIcon,
    Grid3X3,
    Calendar,
    Twitter,
    Instagram,
    Globe,
    CheckCircle2,
    Share2,
    ChevronUp,
    ChevronDown,
    Menu,
    Users,
    X,
} from "lucide-react"

import { Button } from "~/components/shadcn/ui/button"
import { Tabs, TabsContent } from "~/components/shadcn/ui/tabs"
import { Badge } from "~/components/shadcn/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Separator } from "~/components/shadcn/ui/separator"
import { cn } from "~/lib/utils"
import { api } from "~/utils/api"
import ArtistProfileSkeleton from "~/components/creator/artist-profile-loading"
import NotFound from "~/pages/404"
import CustomAvatar from "~/components/common/custom-avatar"
import { useSession } from "next-auth/react"
import PostCard from "~/components/post/post-card-modern"
import toast from "react-hot-toast"
import { Skeleton } from "~/components/shadcn/ui/skeleton"
import { MoreAssetsSkeleton } from "~/components/common/grid-loading"
import MarketAssetComponent from "~/components/common/market-asset"
import { getAssetBalanceFromBalance } from "~/lib/stellar/marketplace/test/acc"
import FollowAndMembershipButton from "~/components/creator/follow-creator-button"
import { Glass } from "~/components/glass/glass"

export default function ArtistProfileModern() {
    const router = useRouter()
    const { id } = router.query as { id: string }

    const session = useSession()
    const [activeTab, setActiveTab] = useState("posts")
    const contentRef = useRef<HTMLDivElement>(null)
    const [isScrolled, setIsScrolled] = useState(false)
    const [scrollProgress, setScrollProgress] = useState(0)
    const [showShareOptions, setShowShareOptions] = useState(false)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [expandedPackage, setExpandedPackage] = useState<number | null>(null)

    const creator = api.fan.creator.getCreator.useQuery({ id: id ?? "" })
    const subscriptionPackages = api.fan.creator.getCreatorPackages.useQuery({ id: id ?? "" })
    const accBalances = api.wallate.acc.getUserPubAssetBallances.useQuery(undefined, {
        enabled: !!session.data?.user?.id,
    })

    const allCreatedPost = api.fan.post.getPosts.useInfiniteQuery(
        {
            pubkey: id ?? "",
            limit: 10,
        },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
            enabled: !!creator.data,
        },
    )

    const creatorNFT = api.marketplace.market.getCreatorNftsByCreatorID.useInfiniteQuery(
        { limit: 10, creatorId: id ?? "" },
        {
            getNextPageParam: (lastPage) => lastPage.nextCursor,
        },
    )

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen)
    }

    const togglePackageExpansion = (id: number) => {
        if (expandedPackage === id) {
            setExpandedPackage(null)
        } else {
            setExpandedPackage(id)
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const scrollPosition = contentRef.current.scrollTop
                const scrollThreshold = 100

                if (scrollPosition > scrollThreshold) {
                    setIsScrolled(true)
                    setScrollProgress(Math.min(1, (scrollPosition - scrollThreshold) / 50))
                } else {
                    setIsScrolled(false)
                    setScrollProgress(0)
                }
            }
        }

        const currentContentRef = contentRef.current
        if (currentContentRef) {
            currentContentRef.addEventListener("scroll", handleScroll)
        }

        return () => {
            if (currentContentRef) {
                currentContentRef.removeEventListener("scroll", handleScroll)
            }
        }
    }, [id, contentRef.current])

    const handleShare = () => {
        if (navigator.share) {
            navigator
                .share({
                    title: `${creator.data?.name} | Artist Profile`,
                    url: window.location.href,
                })
                .catch((err) => {
                    console.error("Error sharing:", err)
                })
        } else {
            setShowShareOptions(!showShareOptions)
            if (!showShareOptions) {
                navigator.clipboard.writeText(window.location.href)
                toast.success("Profile link copied to clipboard!")
            }
        }
    }

    if (creator.isLoading) {
        return <ArtistProfileSkeleton />
    }

    if (!creator.data) {
        return <NotFound />
    }

    return (
        <div className="flex h-screen flex-col">
            {/* Header with Cover Image */}
            <div
                className="relative w-full transition-all duration-500"
                style={{
                    height: isScrolled ? "0px" : "200px",
                }}
            >
                <div className="relative h-full w-full">
                    <Image
                        src={
                            creator.data.coverUrl?.length === 0 || creator.data.coverUrl === null
                                ? "/images/logo.png"
                                : creator.data.coverUrl
                        }
                        alt={`${creator.data.name}'s cover`}
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-2 z-20 h-9 w-9 bg-white/50 text-white backdrop-blur-md hover:bg-white/70 dark:bg-black/40 dark:hover:bg-black/50 md:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <header
                        className={cn(
                            "absolute left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border border-black/15 px-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-500 dark:border-white/10",
                            isScrolled
                                ? "translate-y-0 opacity-100"
                                : "-translate-y-full opacity-0",
                        )}
                        style={{
                            transform: isScrolled ? `translateY(0)` : `translateY(-100%)`,
                            opacity: scrollProgress,
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <CustomAvatar url={creator.data.profileUrl} className="h-9 w-9 border border-black/15 dark:border-white/15" />
                            <div className="flex flex-col">
                                <span className="flex items-center gap-1 text-sm font-semibold">
                                    {creator.data.name}
                                    {creator.data.approved && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={handleShare}
                        >
                            <Share2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Share</span>
                        </Button>
                    </header>
                </div>
            </div>

            {/* Main Content Area with Responsive Sidebar */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Fixed on desktop, slide-in on mobile */}
                <div
                    className={cn(
                        "absolute z-40 h-full w-[300px] shrink-0 border-r transition-transform duration-500 md:relative",
                        isSidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full md:translate-x-0",
                    )}
                >
                    {/* Close button for mobile sidebar */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 md:hidden"
                        onClick={toggleSidebar}
                    >
                        <X className="h-5 w-5" />
                    </Button>

                    <div className="flex h-full flex-col overflow-auto p-6 pb-32">
                        <div className="flex flex-col items-center pt-4">
                            {/* Profile Image */}
                            <div className="relative">
                                <CustomAvatar
                                    url={creator.data?.profileUrl}
                                    className="h-24 w-24 border border-black/15 dark:border-white/15 shadow-xl"
                                />

                                {creator.data.approved && (
                                    <div className="absolute bottom-1 right-1 rounded-full bg-white/80 p-1 shadow-md backdrop-blur-md dark:bg-black/60">
                                        <CheckCircle2 className="h-4 w-4 text-primary" />
                                    </div>
                                )}
                            </div>

                            {/* Profile Info */}
                            <div className="mt-4 w-full text-center">
                                <h1 className="flex items-center justify-center gap-1 text-xl font-bold md:text-2xl">
                                    {creator.data.name}
                                    {creator.data.approved && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                </h1>

                                <p className="mt-3 text-sm text-muted-foreground">
                                    {creator.data?.bio && creator.data.bio.length > 0
                                        ? creator.data.bio
                                        : "No bio provided"}
                                </p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Profile Stats */}
                        <div className="grid w-full grid-cols-3 gap-2">
                            <div className="cursor-pointer rounded-[0.9rem] border border-black/15 bg-muted/30 p-3 text-center transition-colors hover:bg-muted/50 dark:border-white/10">
                                <p className="text-xl font-bold">
                                    {creator.data._count.followers ?? 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Followers</p>
                            </div>
                            <div className="cursor-pointer rounded-[0.9rem] border border-black/15 bg-muted/30 p-3 text-center transition-colors hover:bg-muted/50 dark:border-white/10">
                                <p className="text-xl font-bold">
                                    {creator.data._count.postGroups ?? 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Posts</p>
                            </div>
                            <div className="cursor-pointer rounded-[0.9rem] border border-black/15 bg-muted/30 p-3 text-center transition-colors hover:bg-muted/50 dark:border-white/10">
                                <p className="text-xl font-bold">
                                    {creator.data._count.assets ?? 0}
                                </p>
                                <p className="text-xs text-muted-foreground">NFTs</p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Social Links */}
                        <div className="w-full space-y-3">
                            {creator.data.website && (
                                <div>
                                    <Link
                                        href={creator.data.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
                                    >
                                        <Globe className="mr-2 h-4 w-4" />
                                        <span>
                                            {creator.data.website.replace(/(^\w+:|^)\/\//, "")}
                                        </span>
                                    </Link>
                                </div>
                            )}
                            {creator.data.twitter && (
                                <div>
                                    <Link
                                        href={`https://twitter.com/${creator.data.twitter}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-sm text-muted-foreground transition-colors hover:text-[#1DA1F2]"
                                    >
                                        <Twitter className="mr-2 h-4 w-4" />
                                        <span>@{creator.data.twitter}</span>
                                    </Link>
                                </div>
                            )}
                            {creator.data.instagram && (
                                <div>
                                    <Link
                                        href={`https://instagram.com/${creator.data.instagram}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-sm text-muted-foreground transition-colors hover:text-[#E1306C]"
                                    >
                                        <Instagram className="mr-2 h-4 w-4" />
                                        <span>@{creator.data.instagram}</span>
                                    </Link>
                                </div>
                            )}

                            <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>
                                    Joined{" "}
                                    {new Date(creator.data.joinedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-10 bg-black/30 backdrop-blur-sm md:hidden"
                        onClick={toggleSidebar}
                    />
                )}

                {/* Right Content Area - Scrollable */}
                <div className="relative flex-1">
                    <div ref={contentRef} className="absolute inset-0 overflow-auto">
                        <div className="p-1 !pb-20 md:p-6">
                            {/* Profile Header */}
                            <div className="mb-8 flex items-center justify-between">
                                <h1 className="text-2xl font-bold md:text-3xl">{creator.data.name}{"'s"} Profile</h1>
                                <div className="flex items-center gap-2">
                                    <FollowAndMembershipButton
                                        creatorId={creator.data.id}
                                        creatorName={creator.data.name}
                                        hasPageAsset={!!creator.data.pageAsset || !!creator.data.customPageAssetCodeIssuer}
                                    />
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Followers</p>
                                            <p className="mt-1 text-2xl font-bold">{creator.data._count.followers ?? 0}</p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                                            <Users className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total Posts</p>
                                            <p className="mt-1 text-2xl font-bold">{creator.data._count.postGroups ?? 0}</p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                                            <Grid3X3 className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Total NFTs</p>
                                            <p className="mt-1 text-2xl font-bold">{creator.data._count.assets ?? 0}</p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Joined</p>
                                            <p className="mt-1 text-sm font-medium">{new Date(creator.data.joinedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subscription Packages Section */}
                            {subscriptionPackages.data && subscriptionPackages.data.length > 0 && (
                                <div className="mb-8">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h2 className="text-xl font-bold">Subscription Packages</h2>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {subscriptionPackages.isLoading && <SubscriptionPackagesSkeleton />}

                                        {subscriptionPackages.data.map((pkg) => (
                                            <Card
                                                key={pkg.id}
                                                className={cn(
                                                    "relative h-full overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-black/40",
                                                    !pkg.isActive && "opacity-60",
                                                    expandedPackage === pkg.id && "ring-2 ring-primary",
                                                )}
                                            >
                                                <div className={cn("h-2", pkg.color)} />

                                                {pkg.popular && (
                                                    <div className="absolute right-0 top-0">
                                                        <div className={cn("px-3 py-1 text-xs font-bold text-primary-foreground", pkg.color)}>
                                                            POPULAR
                                                        </div>
                                                    </div>
                                                )}

                                                <CardHeader className="w-full pb-2">
                                                    <div className="flex w-full justify-between">
                                                        <div className="flex w-full flex-col">
                                                            <CardTitle className="w-full">
                                                                <span>{pkg.name}</span>
                                                            </CardTitle>
                                                            <div className="mt-2 flex items-baseline">
                                                                <span className="text-3xl font-bold">
                                                                    {pkg.price}
                                                                </span>
                                                                <span className="ml-1 text-muted-foreground">
                                                                    {creator.data?.pageAsset
                                                                        ? creator.data?.pageAsset.code
                                                                        : creator.data?.customPageAssetCodeIssuer?.split("-")[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <CardDescription className="mt-2">{pkg.description}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4 pb-2">
                                                    <ul className="space-y-2">
                                                        {pkg.features
                                                            .slice(
                                                                0,
                                                                expandedPackage === pkg.id
                                                                    ? pkg.features.length
                                                                    : 3,
                                                            )
                                                            .map((feature, i) => (
                                                                <li key={i} className="flex items-start gap-2">
                                                                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                                                    <span className="text-sm">{feature}</span>
                                                                </li>
                                                            ))}
                                                    </ul>

                                                    {pkg.features.length > 3 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-xs h-7"
                                                            onClick={() => togglePackageExpansion(pkg.id)}
                                                        >
                                                            {expandedPackage === pkg.id ? (
                                                                <>
                                                                    <ChevronUp className="mr-1 h-4 w-4" />
                                                                    Show Less
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="mr-1 h-4 w-4" />
                                                                    Show All Features
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </CardContent>
                                                <CardFooter className="pb-4 pt-0">
                                                    <div className="flex w-full items-center justify-between">
                                                        <Badge variant={pkg.isActive ? "default" : "outline"}>
                                                            {pkg.isActive ? "Active" : "Inactive"}
                                                        </Badge>
                                                    </div>
                                                </CardFooter>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content Tabs */}
                            <div>
                                <Tabs
                                    defaultValue="posts"
                                    value={activeTab}
                                    onValueChange={setActiveTab}
                                    className="w-full"
                                >
                                    <div className="mb-6 w-full px-3 md:px-0">
                                        <div className="relative mx-auto w-fit overflow-hidden rounded-[0.9rem] border border-black/15 p-[0.3rem] shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                                            <Glass
                                                className={{
                                                    root: "pointer-events-none absolute inset-0 z-0 rounded-[0.9rem]",
                                                    tint: "bg-[#f3f1ea]/65",
                                                    effect:
                                                        "bg-[radial-gradient(circle_at_20%_20%,rgba(255,251,242,0.24),rgba(248,243,232,0.08)_55%,rgba(245,240,230,0.03)_100%)] backdrop-blur-[8px]",
                                                    shine:
                                                        "shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.85),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]",
                                                }}
                                            />
                                            <div className="relative z-10 inline-flex items-center gap-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab("posts")}
                                                    className={cn(
                                                        "relative inline-flex items-center justify-center gap-1.5 rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                                                        activeTab === "posts"
                                                            ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                                                            : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                                                    )}
                                                >
                                                    <Grid3X3 className="h-4 w-4" />
                                                    Posts
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab("nfts")}
                                                    className={cn(
                                                        "relative inline-flex items-center justify-center gap-1.5 rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                                                        activeTab === "nfts"
                                                            ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                                                            : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                                                    )}
                                                >
                                                    <ImageIcon className="h-4 w-4" />
                                                    NFTs
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Posts Tab */}
                                    <TabsContent value="posts" className="mb-16 space-y-6">
                                        <div className="space-y-6">
                                            {allCreatedPost.isLoading && (
                                                <div className="space-y-4">
                                                    {[1, 2, 3].map((i) => (
                                                        <div key={i} className="overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-4 backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                                                            <div className="mb-2 flex items-center gap-3">
                                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                                <div>
                                                                    <Skeleton className="mb-1 h-4 w-32" />
                                                                    <Skeleton className="h-3 w-24" />
                                                                </div>
                                                            </div>
                                                            <Skeleton className="mb-2 h-4 w-full" />
                                                            <Skeleton className="mb-2 h-4 w-full" />
                                                            <Skeleton className="mb-4 h-4 w-2/3" />
                                                            <Skeleton className="mb-4 h-48 w-full rounded-md" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {allCreatedPost.data?.pages.map((page, i) => (
                                                <React.Fragment key={i}>
                                                    {page.posts.map((post) => {
                                                        const locked = !!post.subscription

                                                        let hasAccess = !locked

                                                        if (locked && post.subscription) {
                                                            let pageAssetCode: string | undefined
                                                            let pageAssetIssuer: string | undefined

                                                            const customPageAsset = post.creator.customPageAssetCodeIssuer
                                                            const pageAsset = post.creator.pageAsset

                                                            if (pageAsset) {
                                                                pageAssetCode = pageAsset.code
                                                                pageAssetIssuer = pageAsset.issuer
                                                            } else if (customPageAsset) {
                                                                const [code, issuer] = customPageAsset.split("-")
                                                                pageAssetCode = code
                                                                pageAssetIssuer = issuer
                                                            }

                                                            const bal = getAssetBalanceFromBalance({
                                                                balances: accBalances.data,
                                                                code: pageAssetCode,
                                                                issuer: pageAssetIssuer,
                                                            })

                                                            hasAccess = post.subscription.price <= (bal ?? 0) ||
                                                                post.creatorId === session.data?.user?.id
                                                        }

                                                        return (
                                                            <PostCard
                                                                key={post.id}
                                                                post={post}
                                                                creator={post.creator}
                                                                likeCount={post._count.likes}
                                                                commentCount={post._count.comments}
                                                                locked={locked}
                                                                show={hasAccess}
                                                                media={post.medias}
                                                            />
                                                        )
                                                    })}
                                                </React.Fragment>
                                            ))}

                                            {allCreatedPost.hasNextPage && (
                                                <Button
                                                    variant="outline"
                                                    className="w-full bg-muted/50 text-foreground hover:bg-muted/70"
                                                    onClick={() => allCreatedPost.fetchNextPage()}
                                                    disabled={allCreatedPost.isFetchingNextPage}
                                                >
                                                    {allCreatedPost.isFetchingNextPage ? "Loading more..." : "Load More Posts"}
                                                </Button>
                                            )}

                                            {allCreatedPost.data?.pages[0]?.posts.length === 0 && (
                                                <div className="rounded-[0.9rem] border border-black/15 bg-white/60 py-12 text-center backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                                                    <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                                    <h3 className="mb-2 text-lg font-medium">No Posts Yet</h3>
                                                    <p className="mb-4 text-muted-foreground">
                                                        This creator hasn{"'t"} posted any content yet
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* NFTs Tab */}
                                    <TabsContent value="nfts">
                                        <div className="flex min-h-[calc(100vh-20vh)] flex-col gap-4 rounded-md p-4">
                                            {creatorNFT.isLoading && (
                                                <MoreAssetsSkeleton className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 xl:grid-cols-5" />
                                            )}

                                            {creatorNFT.data?.pages[0]?.nfts.length === 0 && (
                                                <div className="flex h-full flex-col items-center justify-center text-lg font-bold">
                                                    <ImageIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                                    <h3 className="mb-2 text-lg font-medium">No NFTs Found</h3>
                                                    <p className="mb-4 text-muted-foreground">
                                                        This creator hasn{"'t"} created any NFTs yet
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
                                                {creatorNFT.data?.pages.map((items, itemIndex) =>
                                                    items.nfts.map((item, index) => (
                                                        <MarketAssetComponent
                                                            key={`music-${itemIndex}-${index}`}
                                                            item={item}
                                                        />
                                                    )),
                                                )}
                                            </div>

                                            {creatorNFT.hasNextPage && (
                                                <Button
                                                    className="flex w-1/2 items-center justify-center bg-muted text-foreground shadow-none hover:bg-muted/70 md:w-1/4"
                                                    onClick={() => creatorNFT.fetchNextPage()}
                                                    disabled={creatorNFT.isFetchingNextPage}
                                                >
                                                    {creatorNFT.isFetchingNextPage ? "Loading more..." : "Load More"}
                                                </Button>
                                            )}
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function SubscriptionPackagesSkeleton() {
    const skeletonCards = Array(3).fill(null)

    return (
        <>
            {skeletonCards.map((_, index) => (
                <div key={index} className="relative h-full overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-0 backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                    <div className="h-2 bg-muted" />
                    <div className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                            <div className="w-full">
                                <Skeleton className="mb-2 h-6 w-3/4" />
                                <div className="mt-2 flex items-baseline">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="ml-1 h-4 w-12" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-8 rounded-full" />
                        </div>
                        <Skeleton className="mt-2 h-4 w-full" />
                    </div>
                    <div className="space-y-4 px-4 pb-2">
                        <div className="space-y-2">
                            {Array(4)
                                .fill(null)
                                .map((_, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                        <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                ))}
                        </div>
                        <Skeleton className="h-8 w-full" />
                    </div>
                    <div className="px-4 pb-4 pt-0">
                        <div className="flex w-full items-center justify-between">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    )
}
