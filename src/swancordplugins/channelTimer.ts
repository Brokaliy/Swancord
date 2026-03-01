/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const WIDGET_ID = "swancord-channel-timer";
const STYLE_ID = "swancord-channel-timer-style";

let enteredAt: number | null = null;
let tickTimer: ReturnType<typeof setInterval> | null = null;
let widget: HTMLElement | null = null;

function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

function updateWidget() {
    if (!widget) return;
    if (!enteredAt) { widget.textContent = ""; return; }
    widget.textContent = `In channel: ${formatTime(Date.now() - enteredAt)}`;
}

function onChannelSelect() {
    enteredAt = Date.now();
    updateWidget();
}

export default definePlugin({
    name: "ChannelTimer",
    description: "Shows how long you have been viewing the current text channel.",
    authors: [Devs._7n7],

    start() {
        enteredAt = Date.now();

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${WIDGET_ID} {
                position: fixed;
                top: 8px;
                right: 16px;
                font-size: 10px;
                color: rgba(255,255,255,0.22);
                pointer-events: none;
                z-index: 9998;
                font-family: var(--font-code);
            }
        `;
        document.head.appendChild(style);

        widget = document.createElement("div");
        widget.id = WIDGET_ID;
        document.body.appendChild(widget);

        tickTimer = setInterval(updateWidget, 1000);
        FluxDispatcher.subscribe("CHANNEL_SELECT", onChannelSelect);
        updateWidget();
    },

    stop() {
        if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
        FluxDispatcher.unsubscribe("CHANNEL_SELECT", onChannelSelect);
        widget?.remove();
        widget = null;
        document.getElementById(STYLE_ID)?.remove();
        enteredAt = null;
    },
});
