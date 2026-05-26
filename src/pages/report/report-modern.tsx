/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

"use client";

import type React from "react";

import { useState, useMemo } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  Filter,
  Loader2,
  MapPin,
  Users,
  X,
  ArrowUpRight,
  ArrowDownRight,
  MessageCircle,
  Grid3X3,
  ImageIcon,
} from "lucide-react";

import { api } from "~/utils/api";
import { Button } from "~/components/shadcn/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { Badge } from "~/components/shadcn/ui/badge";
import { Skeleton } from "~/components/shadcn/ui/skeleton";
import { cn } from "~/lib/utils";
import { Tabs, TabsContent } from "~/components/shadcn/ui/tabs";
import { Glass } from "~/components/glass/glass";

import { useSession } from "next-auth/react";
import { PinAgentChatBox } from "~/components/agent/PinChat";
import {
  TableData,
  ReportDownloadItem,
  DownloadPinLocationAsCSV,
  LoadingState,
  EmptyState,
  CreatorDropDown,
  type CreatorConsumedPin,
} from "./report-legacy";

function CreatorCollectionReportModern() {
  const session = useSession();
  const [selectedDays, setSelectedDays] = useState<number | undefined>(
    undefined,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [creatorId, setCreatorId] = useState<string | undefined>(session.data?.user.id);

  const pins = api.maps.pin.getCreatorPinTConsumedByUser.useQuery(
    {
      day: selectedDays,
      creatorId: creatorId,
    },
    {
      enabled: true,
    },
  );

  const metrics = useMemo(() => {
    if (!pins.data) return null;

    const totalPins = pins.data.length;
    const totalLocations = pins.data.reduce(
      (acc, pin) => acc + pin.locations.length,
      0,
    );

    const totalConsumers = pins.data.reduce((acc, pin) => {
      return (
        acc +
        pin.locations.reduce((locAcc, loc) => locAcc + loc.consumers.length, 0)
      );
    }, 0);

    const consumptionRate =
      totalLocations > 0
        ? Math.round((totalConsumers / totalLocations) * 100)
        : 0;

    const topPins = [...pins.data]
      .map((pin) => {
        const consumerCount = pin.locations.reduce(
          (acc, loc) => acc + loc.consumers.length,
          0,
        );
        return { id: pin.id, title: pin.title, consumerCount };
      })
      .sort((a, b) => b.consumerCount - a.consumerCount)
      .slice(0, 5);

    return {
      totalPins,
      totalLocations,
      totalConsumers,
      consumptionRate,
      topPins,
    };
  }, [pins.data]);

  if (pins.isLoading) {
    return <LoadingStateModern />;
  }

  if (!pins.data) {
    return (
      <div className="container mx-auto px-4 py-8 pb-24">
        <CreatorDropDown creatorId={creatorId} setCreatorId={setCreatorId} />
        <EmptyState message="No data available" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Collection Reports
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze your pin collection performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-black/15 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {selectedDays ? `Last ${selectedDays} days` : "All time"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setSelectedDays(undefined)}>
                All time
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDays(7)}>
                Last 7 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDays(15)}>
                Last 15 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDays(30)}>
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedDays(90)}>
                Last 90 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-black/15 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <ReportDownloadItem day={7} creatorId={creatorId}>
                Last 7 days (Weekly)
              </ReportDownloadItem>
              <ReportDownloadItem day={30} creatorId={creatorId}>
                Last 30 days (Monthly)
              </ReportDownloadItem>
              <ReportDownloadItem day={90} creatorId={creatorId}>
                Last 90 days (Quarterly)
              </ReportDownloadItem>
              <ReportDownloadItem day={365} creatorId={creatorId}>
                Last 365 days (Yearly)
              </ReportDownloadItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedDays && (
        <div className="mb-6">
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-black/15 bg-white/60 px-3 py-1 backdrop-blur-md dark:border-white/10 dark:bg-black/40"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Filtered to last {selectedDays} days</span>
            <X
              className="ml-1 h-3 w-3 cursor-pointer opacity-70 hover:opacity-100"
              onClick={() => setSelectedDays(undefined)}
            />
          </Badge>
        </div>
      )}

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="w-full">
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
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "relative inline-flex items-center justify-center gap-1.5 rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  activeTab === "overview"
                    ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                    : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                )}
              >
                <Grid3X3 className="h-4 w-4" />
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("data")}
                className={cn(
                  "relative inline-flex items-center justify-center gap-1.5 rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
                  activeTab === "data"
                    ? "border-white/60 bg-white/55 text-black shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] backdrop-blur-[6px]"
                    : "border-transparent bg-transparent text-black/65 hover:bg-white/35 hover:text-black",
                )}
              >
                <ImageIcon className="h-4 w-4" />
                Data Table
              </button>
            </div>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {metrics && (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <GlassMetricCard
                  title="Total Pins"
                  value={metrics.totalPins}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <GlassMetricCard
                  title="Total Locations"
                  value={metrics.totalLocations}
                  icon={<MapPin className="h-4 w-4" />}
                />
                <GlassMetricCard
                  title="Total Consumers"
                  value={metrics.totalConsumers}
                  icon={<Users className="h-4 w-4" />}
                />
                <GlassMetricCard
                  title="Consumption Rate"
                  value={`${metrics.consumptionRate}%`}
                  icon={<BarChart3 className="h-4 w-4" />}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                  <div className="p-6 pb-2">
                    <h3 className="text-lg font-medium">Top Performing Pins</h3>
                    <p className="text-sm text-muted-foreground">
                      Pins with the highest consumer engagement
                    </p>
                  </div>
                  <div className="p-6 pt-2">
                    <div className="space-y-4">
                      {metrics.topPins.map((pin, index) => (
                        <div
                          key={pin.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{pin.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {pin.id}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="border-black/15 bg-white/60 backdrop-blur-md dark:border-white/10 dark:bg-black/40 text-foreground"
                            >
                              {pin.consumerCount} consumers
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="px-6 pb-4 pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full hover:bg-white/40"
                      onClick={() => setActiveTab("data")}
                    >
                      View all pins
                    </Button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
                  <div className="p-6 pb-2">
                    <h3 className="text-lg font-medium">Recent Activity</h3>
                    <p className="text-sm text-muted-foreground">
                      Latest consumer interactions
                    </p>
                  </div>
                  <div className="p-6 pt-2">
                    <div className="space-y-4">
                      {pins.data
                        .slice(0, 5)
                        .flatMap((pin) =>
                          pin.locations.flatMap((location) =>
                            location.consumers.slice(0, 1).map((consumer) => (
                              <div
                                key={`${pin.id}-${location.id}-${consumer.user.id}`}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                    {consumer.user.name?.[0] ?? "U"}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {consumer.user.email ?? "Anonymous User"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Collected from {pin.title}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {consumer.claimedAt
                                    ? new Date(
                                      consumer.claimedAt,
                                    ).toLocaleDateString()
                                    : "Unknown date"}
                                </div>
                              </div>
                            )),
                          ),
                        )
                        .slice(0, 5)}
                    </div>
                  </div>
                  <div className="px-6 pb-4 pt-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full hover:bg-white/40"
                      onClick={() => setActiveTab("data")}
                    >
                      View all activity
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="data">
          <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
            <div className="p-0 pt-6">
              <TableData
                pins={pins.data}
                selectedDays={selectedDays}
                setSelectedDays={setSelectedDays}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isLoading={pins.isLoading}
                isRefetching={pins.isRefetching}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-lg animate-bounce"
        size="icon"
      >
        <MessageCircle className="h-7 w-7 fill-current" />
      </Button>
      <PinAgentChatBox
        creatorId={session.data?.user.id}
        isOpen={isOpen}
        closeChat={() => setIsOpen(false)}
      />
    </div>
  );
}

export default CreatorCollectionReportModern;

function GlassMetricCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
}) {
  return (
    <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-black/40">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm font-medium text-muted-foreground">
          {title}
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-xs">
          {trend.value > 0 ? (
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
          )}
          <span
            className={trend.value > 0 ? "text-green-500" : "text-red-500"}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="ml-1 text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

function LoadingStateModern() {
  return (
    <div className="container mx-auto px-4 py-8 pb-24">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Collection Reports
          </h1>
          <p className="text-muted-foreground">
            Monitor and analyze your pin collection performance
          </p>
        </div>
      </div>
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="mt-2 h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="relative overflow-hidden rounded-[0.9rem] border border-black/15 bg-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
}
