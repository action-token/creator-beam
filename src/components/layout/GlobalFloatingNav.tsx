"use client";

import { motion } from "framer-motion";
import type { ComponentType } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Map,
  Target,
  Gift,
  Store,
  MapPin,
  BarChart3,
  User,
  QrCode,
  HandCoins,
} from "lucide-react";

import { cn } from "~/utils/utils";

type NavItem = {
  key: string;
  path: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
  { key: "Map", path: "/map", text: "MAP", icon: Map },
  { key: "Beam", path: "/beam", text: "BEAM", icon: QrCode },
  { key: "Bounties", path: "/bounties", text: "BOUNTIES", icon: Target },
  { key: "Followers", path: "/gifts", text: "FOLLOWERS", icon: Gift },
  { key: "Stores", path: "/stores", text: "STORES", icon: Store },
  { key: "Redeem", path: "/redeem", text: "REDEEM", icon: HandCoins },
  { key: "Pin Management", path: "/pin-manage", text: "PINS", icon: MapPin },
  { key: "Report", path: "/report", text: "REPORT", icon: BarChart3 },
  { key: "Profile", path: "/profile", text: "PROFILE", icon: User },
];

function FloatingNavItem({
  item,
  isActive,
  itemWidth,
}: {
  item: NavItem;
  isActive: boolean;
  itemWidth: string;
}) {
  const Icon = item.icon;

  const itemBody = (
    <motion.div
      className={cn(
        "relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors",
        itemWidth,
        isActive ? "text-blue-600" : "text-black/85",
      )}
      transition={{ type: "spring", stiffness: 180, damping: 24, mass: 0.9 }}
    >
      <div className="relative z-30 grid size-5 place-items-center">
        <Icon className="size-5" />
      </div>
      <div className="relative z-30 text-center">
        <span className="relative z-10 block truncate whitespace-nowrap text-sm font-medium uppercase leading-tight">
          {item.text}
        </span>
      </div>
    </motion.div>
  );

  return (
    <Link
      href={item.path}
      aria-current={isActive ? "page" : undefined}
      className={cn("block", itemWidth)}
    >
      {itemBody}
    </Link>
  );
}

export default function GlobalFloatingNav() {
  const router = useRouter();

  const activeKey =
    navItems.find((item) =>
      item.path === "/"
        ? router.pathname === "/"
        : router.pathname?.startsWith(item.path),
    )?.key ?? "";

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] hidden items-end justify-center md:flex md:px-4 md:pb-4">
      <motion.div
        layout="position"
        initial={{ y: 42, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 145, damping: 24, mass: 0.95 }}
        className="pointer-events-auto relative z-20 w-fit max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-black/20 p-1 md:max-w-[calc(100vw-2rem)]"
      >
        <div className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-[#f3f1ea]/60 backdrop-blur-[8px]" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-[radial-gradient(circle_at_20%_20%,rgba(255,251,242,0.24),rgba(248,243,232,0.08)_55%,rgba(245,240,230,0.03)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 rounded-xl shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.85),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.5)]" />

        <motion.nav className="relative z-10 flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] md:gap-1.5 md:overflow-x-hidden [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => {
            const isNarrow = item.key === "Map" || item.key === "Beam" || item.key === "Pin Management" || item.key === "Report";
            const itemWidth = isNarrow ? "w-[64px]" : "w-[80px]";
            return (
              <FloatingNavItem
                key={item.key}
                item={item}
                isActive={activeKey === item.key}
                itemWidth={itemWidth}
              />
            );
          })}
        </motion.nav>
      </motion.div>
    </div>
  );
}
