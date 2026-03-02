/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-message-heatmap";

const settings = definePluginSettings({
    maxAgeMins: {
        type: OptionType.NUMBER,
        description: "Messages older than this many minutes will be at minimum opacity (default: 60)",
        default: 60,
    },
    minOpacity: {
        type: OptionType.NUMBER,
        description: "Minimum opacity for the oldest visible messages (0.2–1.0, default: 0.45)",
        default: 0.45,
    },
    intervalSecs: {
        type: OptionType.NUMBER,
        description: "How often (seconds) to re-calculate opacity across visible messages (default: 30)",
        default: 30,
    },
});

let interval: ReturnType<typeof setInterval> | null = null;

function applyHeatmap() {
    const maxAge = Math.max(1, settings.store.maxAgeMins) * 60 * 1000;
    const minOp = Math.max(0.1, Math.min(1.0, settings.store.minOpacity));
    const now = Date.now();

    document.querySelectorAll<HTMLElement>("li[id^='chat-messages-']").forEach(li => {
        const ts = li.querySelector<HTMLElement>("[class*='timestamp_'] time");
        if (!ts) return;
        const dt = ts.getAttribute("datetime");
        if (!dt) return;
        const age = now - new Date(dt).getTime();
        const ratio = Math.min(1, age / maxAge); // 0 = fresh, 1 = old
        const opacity = 1 - ratio * (1 - minOp);
        li.style.opacity = String(Math.round(opacity * 100) / 100);
        li.style.transition = "opacity 1.5s ease";
    });
}

export default definePlugin({
    name: "MessageHeatmap",
    description: "Fades older messages to a lower opacity based on their age, keeping recent messages visually prominent.",
    authors: [Devs._7n7],
    settings,

    start() {
        applyHeatmap();
        interval = setInterval(applyHeatmap, Math.max(5, settings.store.intervalSecs) * 1000);
    },

    stop() {
        if (interval) { clearInterval(interval); interval = null; }
        // Restore opacity
        document.querySelectorAll<HTMLElement>("li[id^='chat-messages-']").forEach(li => {
            li.style.opacity = "";
            li.style.transition = "";
        });
        document.getElementById(STYLE_ID)?.remove();
    },
});
