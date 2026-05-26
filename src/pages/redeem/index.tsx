"use client";

import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import RedeemPageLegacy from "./redeem-legacy";
import RedeemPageModern from "./redeem-modern";

const LAYOUT_MODE_COOKIE = "beam-layout-mode";
type LayoutMode = "modern" | "legacy";

export default function RedeemPage() {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>("legacy");

    useEffect(() => {
        const storedMode = getCookie(LAYOUT_MODE_COOKIE);
        if (storedMode === "legacy" || storedMode === "modern") {
            setLayoutMode(storedMode);
        }
    }, []);

    if (layoutMode === "modern") {
        return <RedeemPageModern />;
    }

    return <RedeemPageLegacy />;
}
