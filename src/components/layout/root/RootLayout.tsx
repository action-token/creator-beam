"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { ConnectWalletButton } from "package/connect_wallet";
import React, { useEffect, useState } from "react";
import { getCookie, setCookie } from "cookies-next";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Toaster } from "~/components/shadcn/ui/toaster";
import { Navigation } from "../../common/navigation";
import CreatorLayout from "./CreatorLayout";
import AdminLayout from "./AdminLayout";
import { useSidebar } from "~/hooks/use-sidebar";
import { cn } from "~/utils/utils";
import Header from "../Header";
import Sidebar from "../Left-sidebar/sidebar";

const LAYOUT_MODE_COOKIE = "beam-layout-mode";
type LayoutMode = "modern" | "legacy";

const GlobalFloatingNav = dynamic(
  async () => await import("../GlobalFloatingNav"),
  { ssr: false },
);

export default function RootLayout({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const session = useSession();
  const adminRoute = router.pathname.startsWith("/admin");
  const { isMinimized, toggle } = useSidebar();
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("modern");
  const [hasOpenDialog, setHasOpenDialog] = useState(false);
  const isLegacyLayout = layoutMode === "legacy";

  const isHomeRoute = router.pathname === "/";

  useEffect(() => {
    const storedMode = getCookie(LAYOUT_MODE_COOKIE);
    if (storedMode === "legacy" || storedMode === "modern") {
      setLayoutMode(storedMode);
    }
  }, []);

  useEffect(() => {
    const detectOpenDialog = () => {
      if (typeof document === "undefined") return;
      const openDialogs = document.querySelectorAll(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]',
      );
      setHasOpenDialog(openDialogs.length > 0);
    };

    detectOpenDialog();
    const observer = new MutationObserver(detectOpenDialog);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-state", "role"],
    });

    return () => observer.disconnect();
  }, []);

  const onToggleLayoutMode = () => {
    const nextMode: LayoutMode = isLegacyLayout ? "modern" : "legacy";
    setLayoutMode(nextMode);
    setCookie(LAYOUT_MODE_COOKIE, nextMode, {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  };

  const handleToggle = () => {
    toggle();
  };

  if (isLegacyLayout) {
    return (
      <>
        <div className="flex h-screen">
          <Navigation />
          <div className="relative shadow-sm shadow-primary">
            <ChevronLeft
              className={cn(
                "fixed left-[17rem] top-24 z-50 hidden cursor-pointer rounded-full border-2 bg-background text-3xl text-foreground shadow-sm shadow-black transition-all duration-500 ease-in-out md:block",
                isMinimized && "left-[4.5rem] rotate-180",
                isHomeRoute ? "top-24" : "top-24",
              )}
              onClick={handleToggle}
            />
          </div>
          <main className="flex-1 overflow-auto scrollbar-hide">
            {session.status === "unauthenticated" ? (
              <div className="flex h-full items-center justify-center">
                <Card className="w-96">
                  <CardHeader>
                    <CardTitle>Connect Wallet</CardTitle>
                    <CardDescription>
                      Please connect your wallet to continue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <ConnectWalletButton />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="w-full overflow-y-auto scrollbar-hide">
                {adminRoute ? (
                  <AdminLayout>{children}</AdminLayout>
                ) : (
                  <CreatorLayout>{children}</CreatorLayout>
                )}
                <Toaster />
              </div>
            )}
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col">
        {!router.pathname?.includes("/beam/ar") && (
          <Header
            layoutMode={layoutMode}
            onToggleLayoutMode={onToggleLayoutMode}
          />
        )}
        <main className="flex-1 overflow-auto scrollbar-hide">
          {session.status === "unauthenticated" ? (
            <div className="flex h-full items-center justify-center">
              <Card className="w-96">
                <CardHeader>
                  <CardTitle>Connect Wallet</CardTitle>
                  <CardDescription>
                    Please connect your wallet to continue.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ConnectWalletButton />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full overflow-y-auto pb-24 scrollbar-hide md:pb-28">
              {adminRoute ? (
                <AdminLayout>{children}</AdminLayout>
              ) : (
                <CreatorLayout>{children}</CreatorLayout>
              )}
              <Toaster />
            </div>
          )}
        </main>
        {!isLegacyLayout &&
        !hasOpenDialog &&
        session.status === "authenticated" ? (
          <GlobalFloatingNav />
        ) : null}
      </div>
    </>
  );
}
