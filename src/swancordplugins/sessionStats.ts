/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, Toasts, UserStore } from "@webpack/common";

const STYLE_ID = "swancord-session-stats-style";
const WIDGET_ID = "swancord-session-stats";

let sent = 0;
let received = 0;
let sessionStart = 0;
let widget: HTMLElement | null = null;
let statTimer: ReturnType<typeof setInterval> | null = null;

function onMessage(event: any) {
    const msg = event?.message;
    if (!msg) return;
    const me = UserStore.getCurrentUser?.();
    if (msg.author?.id === me?.id) sent++;
    else received++;
    updateWidget();
}

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
    const elapsed = Date.now() - sessionStart;
    widget.innerHTML = `↑${sent} ↓${received} ⏱${formatTime(elapsed)}`;
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        Toasts.show({
            message: `Session: ↑ ${sent} sent · ↓ ${received} received · ${formatTime(Date.now() - sessionStart)}`,
            type: Toasts.Type.MESSAGE,
            id: Toasts.genId(),
            options: { duration: 4000 },
        });
    }
}

export default definePlugin({
    name: "SessionStats",
    description: "Tracks messages sent/received this session. Small HUD widget + Alt+Shift+S for a toast summary.",
    authors: [Devs._7n7],

    start() {
        sent = 0;
        received = 0;
        sessionStart = Date.now();

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${WIDGET_ID} {
                position: fixed;
                bottom: 36px;
                right: 16px;
                font-size: 10px;
                color: rgba(255,255,255,0.28);
                pointer-events: none;
                z-index: 9998;
                font-family: var(--font-code);
                letter-spacing: 0.04em;
            }
        `;
        document.head.appendChild(style);

        widget = document.createElement("div");
        widget.id = WIDGET_ID;
        document.body.appendChild(widget);
        updateWidget();

        statTimer = setInterval(updateWidget, 5000);

        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
        document.addEventListener("keydown", onKey);
    },

    stop() {
        if (statTimer) { clearInterval(statTimer); statTimer = null; }
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
        document.removeEventListener("keydown", onKey);
        widget?.remove();
        widget = null;
        document.getElementById(STYLE_ID)?.remove();
    },
});
