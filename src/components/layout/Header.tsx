import Image from "next/image";
import React from "react";
import { twMerge } from "tailwind-merge";

import {
  ArrowLeftRight,
  Bell,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  LogOut,
  Menu,
  Plus,
  ShoppingBag,
  ShoppingCart,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Lottie from "lottie-react";

import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "~/components/shadcn/ui/sheet";
import { Button } from "~/components/shadcn/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/shadcn/ui/dropdown-menu";
import { useUserStellarAcc } from "~/lib/state/wallete/stellar-balances";
import { PLATFORM_ASSET } from "~/lib/stellar/constant";
import { api } from "~/utils/api";
import { useSidebar } from "~/hooks/use-sidebar";
import { DashboardNav } from "./Left-sidebar/dashboard-nav";
import {
  BeamNavigation,
  LeftBottom,
  LeftNavigation,
} from "./Left-sidebar/sidebar";
import { isRechargeAbleClient } from "~/utils/recharge/is-rechargeable-client";
import dynamic from "next/dynamic";
import { cn } from "~/utils/utils";

const ChristmasSleighAnimation = dynamic(
  () => import("../christmas/ChristmasSleigh"),
  {
    ssr: false,
  },
);
const ChristmasWindChimeAnimation = dynamic(
  () => import("../christmas/ChristmasWindChimes"),
  {
    ssr: false,
  },
);

export type LayoutMode = "modern" | "legacy";

type HeaderProps = {
  layoutMode: LayoutMode;
  onToggleLayoutMode: () => void;
};

export default function Header({
  layoutMode,
  onToggleLayoutMode,
}: HeaderProps) {
  if (layoutMode === "modern") {
    return (
      <ModernHeader
        layoutMode={layoutMode}
        onToggleLayoutMode={onToggleLayoutMode}
      />
    );
  }

  return (
    <LegacyHeader
      layoutMode={layoutMode}
      onToggleLayoutMode={onToggleLayoutMode}
    />
  );
}

function ModernHeader({
  onToggleLayoutMode,
  layoutMode,
}: {
  onToggleLayoutMode: () => void;
  layoutMode: "modern" | "legacy";
}) {
  const session = useSession();
  const { isSheetOpen, setIsSheetOpen } = useSidebar();

  return (
    <header className="sticky left-0 right-0 top-0 z-50 h-10 border-b border-border bg-white">
      <div className="relative mx-auto h-full w-full overflow-hidden md:w-[85vw]">
        <div className="relative z-10 flex h-full items-center justify-between px-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6 rounded-lg border-border bg-muted md:hidden"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="h-full w-72 p-0">
                <SheetHeader className="flex items-start justify-between rounded-md bg-primary p-2 shadow-md">
                  <div className="flex items-center gap-0">
                    <Image
                      alt="logo"
                      objectFit="cover"
                      src="/images/logo.png"
                      height={200}
                      width={200}
                      className="h-10 w-10"
                    />
                    <h1 className="relative text-xl font-bold capitalize text-black md:text-4xl">
                      <p className="">BEAM</p>
                      <p className="absolute right-0 top-0 -mr-4 -mt-1 text-xs">
                        TM
                      </p>
                    </h1>
                  </div>
                </SheetHeader>
                <div className="no-scrollbar flex h-full w-full flex-col items-center justify-between overflow-y-auto p-2">
                  <div className="flex h-full w-full flex-col overflow-x-hidden py-2">
                    <DashboardNav items={LeftNavigation} />
                  </div>
                  <div className="flex h-full w-full flex-col items-center">
                    <LeftBottom
                      layoutMode={layoutMode}
                      onToggleLayoutMode={onToggleLayoutMode}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/map" className="flex items-center gap-1">
              <Image
                alt="Beam"
                src="/images/logo.png"
                width={160}
                height={40}
                className="ml-1 h-7 w-auto object-contain md:h-8"
                priority
              />
              <span className="sr-only">Beam</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <ModernHeaderBalance />
            {session.status === "authenticated" ? (
              <HeaderUserDropdown
                onToggleLayoutMode={onToggleLayoutMode}
                layoutMode="modern"
              />
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function ModernHeaderBalance() {
  const session = useSession();
  const { setBalance, setActive } = useUserStellarAcc();

  const bal = api.wallate.acc.getAccountBalance.useQuery(undefined, {
    onSuccess: (data) => {
      const { balances } = data;
      setBalance(balances);
      setActive(true);
    },
    onError: () => {
      setActive(false);
    },
    enabled: session.data?.user?.id !== undefined,
  });

  if (session.status !== "authenticated") return null;
  if (bal.isLoading) return <div className="skeleton h-7 w-24"></div>;

  return (
    <Link href="/wallet-balance">
      <Button className="h-7 rounded-lg bg-muted px-3 text-xs font-medium text-foreground hover:bg-muted/90">
        {bal.data?.platformAssetBal.toFixed(0)}{" "}
        {PLATFORM_ASSET.code.toUpperCase()}
      </Button>
    </Link>
  );
}

function HeaderUserDropdown({
  onToggleLayoutMode,
  layoutMode,
}: {
  onToggleLayoutMode: () => void;
  layoutMode: LayoutMode;
}) {
  const session = useSession();
  const user = session.data?.user;

  if (!user?.id) return null;

  const displayName =
    user.name?.trim() ?? `${user.id.slice(0, 6)}...${user.id.slice(-4)}`;
  const initials =
    user.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-7 gap-1.5 rounded-lg bg-muted px-2 text-xs font-medium text-foreground hover:bg-muted/90">
          <Avatar className="h-5 w-5 border border-black/10">
            <AvatarImage src={user.image ?? ""} alt={displayName} />
            <AvatarFallback className="text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-9 w-9 border border-black/10">
            <AvatarImage src={user.image ?? ""} alt={displayName} />
            <AvatarFallback className="text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email ?? user.id.slice(0, 12) + "..."}
            </p>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={onToggleLayoutMode}
        >
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          {layoutMode === "modern" ? "Switch to Legacy" : "Switch to Modern"}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LegacyHeader({
  onToggleLayoutMode,
  layoutMode,
}: {
  onToggleLayoutMode: () => void;
  layoutMode: "modern" | "legacy";
}) {
  const router = useRouter();
  const { isSheetOpen, setIsSheetOpen } = useSidebar();
  const isBeamRoute = router.pathname.startsWith("/beam");

  const navigationItems = isBeamRoute ? BeamNavigation : LeftNavigation;

  return (
    <header className="h-22 supports-[backdrop-filter]: sticky top-0 z-50 w-full bg-background/60 bg-background/95 backdrop-blur">
      <div className="h-22 relative px-2 py-4">
        <Image
          src="/images/header.png"
          alt="Header background"
          fill
          className="object-cover object-top"
          priority
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-0">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="link" className="p-2 md:hidden">
                  <Menu color="white" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="h-full w-72 p-0">
                <SheetHeader className="flex items-start justify-between rounded-md bg-primary p-2 shadow-md">
                  <div className="flex items-center gap-0">
                    <Image
                      alt="logo"
                      objectFit="cover"
                      src="/images/logo.png"
                      height={200}
                      width={200}
                      className="h-10 w-10"
                    />
                    <h1 className="relative text-xl font-bold capitalize text-black md:text-4xl">
                      <p className="">BEAM</p>
                      <p className="absolute right-0 top-0 -mr-4 -mt-1 text-xs">
                        TM
                      </p>
                    </h1>
                  </div>
                </SheetHeader>
                <div className="no-scrollbar flex h-full w-full flex-col items-center justify-between overflow-y-auto p-2">
                  <div className="flex h-full w-full flex-col overflow-x-hidden py-2">
                    <DashboardNav items={navigationItems} />
                  </div>
                  <div className="flex h-full w-full flex-col items-center">
                    <LeftBottom
                      layoutMode={layoutMode}
                      onToggleLayoutMode={onToggleLayoutMode}
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <div className="relative ml-2 hidden h-16 w-16 md:block">
              <Image
                alt="logo"
                src="/images/logo.png"
                height={200}
                width={200}
                className="h-14 w-24"
              />
            </div>
            <h1 className="relative hidden text-xl font-bold capitalize text-white md:block md:text-4xl">
              BEAM
              <p className="absolute right-0 top-0 -mr-4 -mt-1 text-xs">TM</p>
            </h1>
          </div>
          <LegacyHeaderButtons onToggleLayoutMode={onToggleLayoutMode} />
        </div>
      </div>
    </header>
  );
}

function LegacyHeaderButtons({
  onToggleLayoutMode,
}: {
  onToggleLayoutMode: () => void;
}) {
  const { setBalance, setActive } = useUserStellarAcc();
  const session = useSession();
  const router = useRouter();
  const bal = api.wallate.acc.getAccountBalance.useQuery(undefined, {
    onSuccess: (data) => {
      const { balances } = data;
      setBalance(balances);
      setActive(true);
    },
    onError: () => {
      setActive(false);
    },
    enabled: session.data?.user?.id !== undefined,
  });
  const updateMutation = api.fan.notification.updateNotification.useMutation();

  const updateNotification = () => {
    updateMutation.mutate();
  };

  const { data: notificationCount } =
    api.fan.notification.getUnseenNotificationCount.useQuery(undefined, {
      enabled: session.data?.user?.id !== undefined,
    });

  const walletType = session.data?.user.walletType ?? WalletType.none;

  const isFBorGoogle = isRechargeAbleClient(walletType);

  if (walletType == WalletType.none) return null;

  if (bal.isLoading) return <div className="skeleton h-10 w-48"></div>;

  if (notificationCount === undefined)
    return <div className="skeleton h-10 w-48"></div>;

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleLayoutMode}
        className={cn("h-10 w-10 rounded-full transition-all")}
        title="Switch to Modern Mode"
      >
        <LayoutGrid className="h-5 w-5" />
      </Button>
      <Link href="/wallet-balance" className="">
        <Button className="">
          <span className="block md:hidden">
            {bal.data?.platformAssetBal.toFixed(0)}
          </span>
          <span className="hidden md:block">
            {bal.data?.platformAssetBal.toFixed(0)}{" "}
            {PLATFORM_ASSET.code.toUpperCase()}
          </span>
        </Button>
      </Link>
      {isFBorGoogle && (
        <Link className=" " href={"/recharge"}>
          <Button className="">
            <ShoppingCart />
          </Button>
        </Link>
      )}
      <Button
        className=" relative "
        onClick={async () => {
          await router.push("/notification");
          updateNotification();
        }}
      >
        {notificationCount > 0 && (
          <div className="absolute -top-2 left-0 h-4 w-4 rounded-full bg-primary"></div>
        )}
        <Bell />
      </Button>
    </div>
  );
}
