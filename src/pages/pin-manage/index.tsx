"use client";

import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import PinManagePageLegacy from "./pin-manage-legacy";
import PinManagePageModern from "./pin-manage-modern";

const LAYOUT_MODE_COOKIE = "beam-layout-mode";
type LayoutMode = "modern" | "legacy";

export default function PinManagePage() {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>("legacy");

    useEffect(() => {
        const storedMode = getCookie(LAYOUT_MODE_COOKIE);
        if (storedMode === "legacy" || storedMode === "modern") {
            setLayoutMode(storedMode);
        }
    }, []);

    if (layoutMode === "modern") {
        return <PinManagePageModern />;
    }

    return <PinManagePageLegacy />;
}
