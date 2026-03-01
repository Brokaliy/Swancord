/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { findByPropsLazy } from "@webpack";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Use Discord's own navigation to open the built-in public server discovery page
const NavigationUtils = findByPropsLazy("transitionTo", "replaceWith", "getLastRouteChangeSource");

function openDiscovery() {
    try {
        NavigationUtils.transitionTo("/guild-discovery");
    } catch (_) {
        // Fallback — find and click Discord's native discover button
        const btn = document.querySelector<HTMLElement>(
            "[aria-label*='Discover'], [class*='discoverButton'], [href*='guild-discovery']"
        );
        btn?.click();
    }
}

// ─── Guild list button ────────────────────────────────────────────────────────

const STYLE_ID = "swancord-server-discover";

const CSS = `
#sc-discover-btn {
    width: 48px; height: 48px; border-radius: 50%;
    background: var(--background-secondary, #111);
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    margin: 4px auto;
    transition: background 0.15s, border-radius 0.15s, transform 0.1s;
    font-size: 1.1rem; color: var(--channels-default, #888);
    position: relative;
}
#sc-discover-btn:hover {
    background: #2a2a2a; border-radius: 16px;
    transform: scale(1.04); color: #f0f0f0;
}
#sc-discover-btn::after {
    content: attr(data-tooltip);
    position: absolute; left: 58px; top: 50%; transform: translateY(-50%);
    background: #111; color: #f0f0f0;
    font-size: 0.8rem; font-weight: 600;
    padding: 6px 10px; border-radius: 6px;
    white-space: nowrap; pointer-events: none;
    opacity: 0; transition: opacity 0.15s;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    z-index: 1001;
}
#sc-discover-btn:hover::after { opacity: 1; }
`;

function mountButton() {
    if (document.getElementById("sc-discover-btn")) return;
    const scroller = document.querySelector<HTMLElement>(
        "nav[class*='guilds_'] [class*='scroller_'], [class*='guildsNav_'] [class*='scroller_']"
    );
    if (!scroller) return;
    const btn = document.createElement("button");
    btn.id = "sc-discover-btn";
    btn.setAttribute("data-tooltip", "Discover Servers");
    btn.textContent = "🔭";
    btn.title = "Discover Servers";
    btn.addEventListener("click", openDiscovery);
    scroller.appendChild(btn);
}

let mountInterval: ReturnType<typeof setInterval> | null = null;
let styleEl: HTMLStyleElement | null = null;

export default definePlugin({
    name: "DisboardSearch",
    description: "Adds a 🔭 Discover button to the guild list that opens Discord's built-in public server discovery page.",
    authors: [Devs._7n7],

    start() {
        styleEl = document.createElement("style");
        styleEl.id = STYLE_ID;
        styleEl.textContent = CSS;
        document.head.appendChild(styleEl);
        mountButton();
        mountInterval = setInterval(() => {
            if (!document.getElementById("sc-discover-btn")) mountButton();
        }, 1000);
    },

    stop() {
        if (mountInterval) { clearInterval(mountInterval); mountInterval = null; }
        document.getElementById("sc-discover-btn")?.remove();
        styleEl?.remove(); styleEl = null;
    },
});
