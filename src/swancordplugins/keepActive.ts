/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    intervalSecs: {
        type: OptionType.NUMBER,
        description: "How often to simulate activity in seconds (default: 20)",
        default: 20,
    },
});

let timer: ReturnType<typeof setInterval> | null = null;

function simulateActivity() {
    // Dispatch a synthetic mousemove to reset Discord's idle timer
    document.dispatchEvent(new MouseEvent("mousemove", {
        bubbles: true,
        clientX: Math.floor(Math.random() * window.innerWidth),
        clientY: Math.floor(Math.random() * window.innerHeight),
    }));
}

export default definePlugin({
    name: "KeepActive",
    description: "Prevents Discord from detecting you as idle/away by periodically simulating mouse activity.",
    authors: [Devs._7n7],
    settings,

    start() {
        timer = setInterval(simulateActivity, (settings.store.intervalSecs || 20) * 1000);
    },

    stop() {
        if (timer) { clearInterval(timer); timer = null; }
    },
});
