"use client";

import { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import ArtistProfileLegacy from "./artist-profile-legacy";
import ArtistProfileModern from "./artist-profile-modern";

const LAYOUT_MODE_COOKIE = "beam-layout-mode";
type LayoutMode = "modern" | "legacy";

export default function ArtistProfilePage() {
    const [layoutMode, setLayoutMode] = useState<LayoutMode>("legacy");

    useEffect(() => {
        const storedMode = getCookie(LAYOUT_MODE_COOKIE);
        if (storedMode === "legacy" || storedMode === "modern") {
            setLayoutMode(storedMode);
        }
    }, []);

    if (layoutMode === "modern") {
        return <ArtistProfileModern />;
    }

    return <ArtistProfileLegacy />;
}
