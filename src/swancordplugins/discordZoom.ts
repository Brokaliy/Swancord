/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const STEP = 0.1;

let zoom = 1;
let indicator: HTMLDivElement | null = null;
let hideTimeout: ReturnType<typeof setTimeout> | null = null;
let wheelHandler: (e: WheelEvent) => void;
let keyHandler: (e: KeyboardEvent) => void;

function createIndicator() {
    indicator = document.createElement("div");
    indicator.id = "vc-discord-zoom-indicator";
    Object.assign(indicator.style, {
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: "99999",
        background: "var(--background-floating, #18191c)",
        color: "var(--text-normal, #dcddde)",
        border: "1px solid var(--background-modifier-accent, rgba(255,255,255,0.08))",
        borderRadius: "8px",
        padding: "6px 14px",
        fontSize: "13px",
        fontWeight: "600",
        fontFamily: "var(--font-display, 'gg sans', sans-serif)",
        letterSpacing: "0.01em",
        pointerEvents: "none",
        userSelect: "none",
        opacity: "0",
        transition: "opacity 0.15s ease",
        boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
    });
    document.body.appendChild(indicator);
}

function showIndicator() {
    if (!indicator) return;
    indicator.textContent = `${Math.round(zoom * 100)}%`;
    indicator.style.opacity = "1";
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
        if (indicator) indicator.style.opacity = "0";
    }, 1200);
}

function applyZoom() {
    document.documentElement.style.zoom = String(Math.round(zoom * 100) / 100);
    showIndicator();
}

export default definePlugin({
    name: "DiscordZoom",
    description: "Zoom in/out with Ctrl+Scroll. Ctrl+0 resets. Shows zoom % in the corner.",
    authors: [Devs._7n7],

    start() {
        zoom = 1;
        createIndicator();

        wheelHandler = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY < 0 ? STEP : -STEP;
            zoom = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta)) * 100) / 100;
            applyZoom();
        };

        keyHandler = (e: KeyboardEvent) => {
            if (!e.ctrlKey || e.key !== "0") return;
            zoom = 1;
            applyZoom();
        };

        window.addEventListener("wheel", wheelHandler, { passive: false, capture: true });
        window.addEventListener("keydown", keyHandler);
    },

    stop() {
        window.removeEventListener("wheel", wheelHandler, { capture: true });
        window.removeEventListener("keydown", keyHandler);
        if (hideTimeout) clearTimeout(hideTimeout);
        indicator?.remove();
        indicator = null;
        document.documentElement.style.zoom = "";
    },
});
