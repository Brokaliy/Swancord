/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-dim-inactive";

const settings = definePluginSettings({
    idleSecs: {
        type: OptionType.NUMBER,
        description: "Seconds of inactivity before dimming kicks in (default: 60)",
        default: 60,
    },
    opacity: {
        type: OptionType.NUMBER,
        description: "Opacity to dim to (0.0–1.0, default: 0.4)",
        default: 0.4,
    },
});

const TRANSITION_CSS = (opacity: number) => `
    #app-mount {
        transition: opacity 1.2s ease !important;
        opacity: ${opacity} !important;
    }
`;

let idleTimer: ReturnType<typeof setTimeout> | null = null;
let dimmed = false;

function resetTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    if (dimmed) {
        dimmed = false;
        updateStyle(1);
    }
    const secs = settings.store.idleSecs;
    if (!secs) return;
    idleTimer = setTimeout(() => {
        dimmed = true;
        updateStyle(settings.store.opacity);
    }, secs * 1000);
}

function updateStyle(opacity: number) {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }
    style.textContent = TRANSITION_CSS(opacity);
}

const EVENTS = ["mousemove", "keydown", "mousedown", "wheel", "touchstart"];

export default definePlugin({
    name: "DimInactiveUI",
    description: "Dims the Discord UI after a configurable period of inactivity and restores it on input.",
    authors: [Devs._7n7],
    settings,

    start() {
        EVENTS.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
        resetTimer();
    },

    stop() {
        EVENTS.forEach(e => window.removeEventListener(e, resetTimer));
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
        document.getElementById(STYLE_ID)?.remove();
        dimmed = false;
    },
});
