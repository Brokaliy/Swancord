/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-rainbow-mode";

const settings = definePluginSettings({
    speed: {
        type: OptionType.NUMBER,
        description: "Hue rotation speed in degrees per second (default: 10)",
        default: 10,
    },
    saturation: {
        type: OptionType.NUMBER,
        description: "Color saturation percentage (default: 70)",
        default: 70,
    },
});

let rafId: number | null = null;
let hue = 0;
let lastTs = 0;
let styleEl: HTMLStyleElement | null = null;

export default definePlugin({
    name: "RainbowMode",
    description: "Slowly cycles Discord accent/brand colors through the full rainbow spectrum.",
    authors: [Devs._7n7],
    settings,

    start() {
        styleEl = document.createElement("style");
        styleEl.id = STYLE_ID;
        document.head.appendChild(styleEl);
        hue = 0;
        lastTs = 0;

        const speed = settings.store.speed || 10;
        const sat = settings.store.saturation || 70;

        function tick(ts: number) {
            const delta = lastTs ? (ts - lastTs) / 1000 : 0;
            lastTs = ts;
            hue = (hue + speed * delta) % 360;
            if (styleEl) {
                styleEl.textContent = `:root {
                    --brand-experiment: hsl(${hue}, ${sat}%, 65%) !important;
                    --brand-experiment-500: hsl(${hue}, ${sat}%, 60%) !important;
                    --brand-experiment-600: hsl(${hue}, ${sat}%, 50%) !important;
                    --focus-color: hsl(${hue}, ${sat}%, 60%) !important;
                }`;
            }
            rafId = requestAnimationFrame(tick);
        }
        rafId = requestAnimationFrame(tick);
    },

    stop() {
        if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
        styleEl?.remove();
        styleEl = null;
        hue = 0;
        lastTs = 0;
    },
});
