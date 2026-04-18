"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "~/components/shadcn/ui/card"
import { Button } from "~/components/shadcn/ui/button"
import { cn } from "~/lib/utils"
import { Star, Eye, ShoppingCart } from "lucide-react"
import { addrShort } from "~/utils/utils"
import { PLATFORM_ASSET } from "~/lib/stellar/constant"
import { motion } from "framer-motion"

interface AssetViewProps {
    creatorId?: string | null
    code?: string
    thumbnail: string | null
    isNFT?: boolean
    isPinned?: boolean
    price?: number
    mediaType?: string
    isPageAsset?: boolean
    percentage?: number | null
    priceInUSD?: number | null
    onBuy?: () => void
    onView?: () => void
    modernVariant?: "collection" | undefined
}

export default function AssetView({
    code,
    thumbnail,
    isNFT = true,
    isPinned = false,
    creatorId,
    price,
    mediaType,
    isPageAsset,
    percentage,
    priceInUSD,
    onBuy,
    onView,
    modernVariant,
}: AssetViewProps) {
    const [isVisible, setIsVisible] = useState(false)
    const handleViewClick = (event: React.MouseEvent) => {
        event.stopPropagation()
        onView?.()
    }
    useEffect(() => {
        setIsVisible(true)
    }, [])

    const isModernCollection = modernVariant === "collection"

    const typeLabel = isPageAsset ? "Page Asset" : mediaType === "THREE_D" ? "3D Model" : mediaType

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full"
            onClick={onBuy}
        >
            <Card className={cn(
                "group h-full overflow-hidden transition-all duration-300 hover:-translate-y-1",
                isModernCollection
                    ? "rounded-[0.95rem] border border-black/10 bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)] hover:shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
                    : "rounded-2xl border border-black/10 bg-transparent shadow-none"
            )}>
                <CardContent className="relative flex h-full flex-col overflow-hidden p-0">
                    <div className={cn(
                        "relative overflow-hidden",
                        isModernCollection ? "aspect-[0.96] rounded-t-[0.95rem] bg-[#d8c7bb]" : "rounded-[1.05rem] border border-white/45 bg-white/35"
                    )}>
                        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-3">
                            {!isPageAsset && !isModernCollection && (
                                <Button
                                    onClick={handleViewClick}
                                    size="sm"
                                    variant="secondary"
                                    className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                >
                                    <Eye className="w-4 h-4" />
                                </Button>
                            )}
                        </div>

                        <Image
                            src={thumbnail ?? "/images/logo.png"}
                            alt="Asset thumbnail"
                            height={280}
                            width={320}
                            className={cn(
                                "w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                                isModernCollection ? "h-full min-h-[240px]" : "h-56"
                            )}
                        />
                    </div>

                    <div className={cn(
                        "flex flex-1 flex-col",
                        isModernCollection ? "gap-2 px-4 pb-3.5 pt-3" : "mt-3 gap-3 p-4"
                    )}>
                        <div className="flex flex-col gap-1.5">
                            {isModernCollection && (
                                <div className="inline-flex w-fit rounded-[2px] bg-[#f3f1ee] px-2 py-0.5 text-[0.64rem] font-medium text-black/60">
                                    {typeLabel}
                                </div>
                            )}
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    {!isModernCollection && (
                                        <div className="text-black/72 flex items-center text-sm">
                                            <span className="truncate font-normal">
                                                {creatorId ? addrShort(creatorId, 5) : "Admin"}
                                            </span>
                                            <motion.div
                                                animate={{ rotate: [0, 15, 0, -15, 0] }}
                                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 4 }}
                                            >
                                                <Star className="ml-2 h-4 w-4 fill-amber-400 text-amber-400" />
                                            </motion.div>
                                        </div>
                                    )}
                                    <h2 className={cn(
                                        "font-semibold leading-tight text-black/90",
                                        isModernCollection ? "line-clamp-1 text-[0.98rem]" : "mt-1 line-clamp-2 text-[1.05rem]"
                                    )}>
                                        {code}
                                    </h2>
                                </div>
                                {isModernCollection ? (
                                    <p className="shrink-0 truncate font-mono text-sm text-black/70">
                                        {creatorId ? addrShort(creatorId, 5) : "Admin"}
                                    </p>
                                ) : (
                                    <div className="shrink-0 rounded-md bg-[#f3f1ee] px-2 py-0.5 font-mono text-[0.64rem] text-black/55">
                                        {creatorId ? addrShort(creatorId, 5) : "Admin"}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={cn(
                            "relative overflow-hidden",
                            isModernCollection ? "rounded-none border-0" : "rounded-[1rem] border border-white/45"
                        )}>
                            {isModernCollection ? (
                                <>
                                    {price ? (
                                        <div className="text-black/88 flex items-center gap-2 text-sm font-medium">
                                            <span>{price}</span>
                                            <span className="text-black/55">{PLATFORM_ASSET.code.toUpperCase()}</span>
                                        </div>
                                    ) : null}
                                    {priceInUSD ? (
                                        <p className="text-black/52 text-sm">~${priceInUSD}</p>
                                    ) : null}
                                </>
                            ) : (
                                <div className="rounded-xl p-4 border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                                    {priceInUSD && price ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">USD Price</span>
                                                <span className="text-lg font-bold text-green-600 dark:text-green-400">${priceInUSD}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Platform Price</span>
                                                <span className="text-sm font-semibold">{price} {PLATFORM_ASSET.code.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    ) : priceInUSD ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Price</span>
                                            <span className="text-xl font-bold text-green-600 dark:text-green-400">${priceInUSD}</span>
                                        </div>
                                    ) : price ? (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Price</span>
                                            <span className="text-xl font-bold">{price} {PLATFORM_ASSET.code.toUpperCase()}</span>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <span className="text-sm font-semibold text-muted-foreground">{typeLabel}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {isModernCollection && price && (
                        <div className="relative z-20 mt-3 md:pointer-events-none md:absolute md:inset-x-0 md:bottom-0 md:mt-0 md:translate-y-full md:opacity-0 md:transition-all md:duration-300 md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100">
                            <Button onClick={onBuy} size="sm" className="h-12 w-full rounded-none border-0 bg-[#1f86ee] px-4 text-base font-semibold text-white shadow-none hover:bg-[#1877da]">
                                <span>Buy Now</span>
                                <span className="ml-auto text-sm">{price} {PLATFORM_ASSET.code.toUpperCase()}</span>
                            </Button>
                        </div>
                    )}
                    {!isModernCollection && price && (
                        <div className="p-4 pt-0">
                            <Button onClick={onBuy} size="sm" className="w-full transition-colors shadow-sm shadow-black/30">
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Buy Now
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    )
}
