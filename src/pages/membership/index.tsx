"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/shadcn/ui/card"
import { Badge } from "~/components/shadcn/ui/badge"


import { CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, Crown, Plus, Star, Zap } from "lucide-react"


import { api } from "~/utils/api"
import { Subscription } from "@prisma/client"
import SubscriptionModal from "~/components/modal/create-subscription-modal"
import { cn } from "~/lib/utils"
import { SubscriptionContextMenu } from "~/components/common/subscripton-context"
import { useState } from "react"
import { Button } from "~/components/shadcn/ui/button"
import { useAddSubsciptionModalStore } from "~/components/store/add-subscription-modal-store"

export type SubscriptionType = Omit<Subscription, "issuerPrivate">;

export { MemberShip }
export default function MemberShip() {
    const { openForCreate, openForEdit } = useAddSubsciptionModalStore()

    const { data: subscriptions } = api.fan.member.getAllMembership.useQuery({});
    const creator = api.fan.creator.meCreator.useQuery(undefined, {
        refetchOnWindowFocus: false,
    })
    const pageAsset = api.fan.creator.getCreatorPageAsset.useQuery();

    console.log("subscriptions", subscriptions)

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold tracking-tight mb-4">Subscription Tiers</h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Choose the perfect tier that fits your needs and unlock exclusive content and features.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                {subscriptions
                    ?.sort((a, b) => a.price - b.price)
                    .map((subscription, index) => {
                        const pageCode = pageAsset?.data?.code
                        return (
                            <MemberShipCard
                                key={subscription.id}
                                creator={creator.data}
                                subscription={subscription}
                                pageAsset={pageCode}
                                priority={index}
                            />
                        )
                    })}
            </div>

            {subscriptions && subscriptions?.length < 3 && pageAsset && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Button
                        size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 h-14 w-14 p-0"
                        onClick={() => openForCreate({
                            customPageAsset: creator.data?.customPageAssetCodeIssuer,
                            pageAsset: creator.data?.pageAsset,
                        })}>
                        <Plus className="h-4 w-4" />

                    </Button>

                </div>
            )
            }

            <SubscriptionModal />
        </div >
    )
}

function MemberShipCard({
    creator,
    subscription,
    className,
    children,
    priority,
    pageAsset,
}: {
    creator: {
        customPageAssetCodeIssuer: string | null;
        pageAsset: {
            code: string;
        } | null;
    } | null
    subscription: {
        name: string;
        id: number;
        features: string[];
        price: number;
        creatorId: string;
        popular: boolean;
        isActive: boolean;
        color: string;
        description: string;
        creator: {
            customPageAssetCodeIssuer: string | null;
            pageAsset: {
                code: string;
            } | null;
        };
    }
    className?: string
    children?: React.ReactNode
    priority?: number
    pageAsset?: string
}) {
    const [expandedPackage, setExpandedPackage] = useState<number | null>(null);

    const togglePackageExpansion = (id: number) => {
        if (expandedPackage === id) {
            setExpandedPackage(null);
        } else {
            setExpandedPackage(id);
        }
    };
    return (
        <Card
            className={cn(
                "relative h-full overflow-hidden border-2 transition-all duration-200 hover:shadow-md",
                subscription.popular ? "border-primary" : "border-border",
                !subscription.isActive && "opacity-60",
                expandedPackage === subscription.id && "ring-2 ring-primary",
            )}
        >
            <div className={cn("h-2", subscription.color)} />
            <CardHeader className="w-full pb-2">
                <div className="flex w-full justify-between">
                    <div className="flex w-full flex-col">
                        <CardTitle className="w-full">
                            <div className="flex w-full items-center justify-between  gap-2">
                                <span> {subscription.name}</span>
                                <SubscriptionContextMenu
                                    creatorId={subscription.creatorId}
                                    subscription={subscription}
                                    pageAsset={creator?.pageAsset}
                                    customPageAsset={
                                        creator?.customPageAssetCodeIssuer
                                    }
                                />
                            </div>
                        </CardTitle>
                        <div className="mt-2 flex items-baseline">
                            <span className="text-3xl font-bold">
                                {subscription.price}
                            </span>
                            <span className="ml-1 text-muted-foreground">
                                {creator?.pageAsset
                                    ? creator?.pageAsset.code
                                    : creator?.customPageAssetCodeIssuer?.split(
                                        "-",
                                    )[0]}
                            </span>
                        </div>
                    </div>
                </div>
                {subscription.popular && (
                    <div className="absolute right-0 top-0">
                        <div className="rounded-bl-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                            POPULAR
                        </div>
                    </div>
                )}
                <CardDescription className="mt-2">
                    {subscription.description}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
                <ul className="space-y-2">
                    {subscription.features
                        .slice(
                            0,
                            expandedPackage === subscription.id
                                ? subscription.features.length
                                : 3,
                        )
                        .map((feature, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                                <span>{feature}</span>
                            </li>
                        ))}
                </ul>

                {subscription.features.length > 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => togglePackageExpansion(subscription.id)}
                    >
                        {expandedPackage === subscription.id ? (
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
            <CardFooter>
                <div className="flex w-full items-center justify-between">
                    <Badge variant={subscription.isActive ? "default" : "outline"}>
                        {subscription.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
            </CardFooter>
        </Card>
    )
}
