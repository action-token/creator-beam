"use client";

import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import CreatorCollectionReportLegacy from "./report-legacy";
import CreatorCollectionReportModern from "./report-modern";

const LAYOUT_MODE_COOKIE = "beam-layout-mode";
type LayoutMode = "modern" | "legacy";

export default function CreatorCollectionReportPage() {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>("legacy");

    useEffect(() => {
        const storedMode = getCookie(LAYOUT_MODE_COOKIE);
        if (storedMode === "legacy" || storedMode === "modern") {
            setLayoutMode(storedMode);
        }
    }, []);

    if (layoutMode === "modern") {
        return <CreatorCollectionReportModern />;
    }

    return <CreatorCollectionReportLegacy />;
}
