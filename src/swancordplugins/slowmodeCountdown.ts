/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, FluxDispatcher, SelectedChannelStore, UserStore } from "@webpack/common";

const WRAP_ID  = "sc-slowmode-wrap";
const STYLE_ID = "sc-slowmode-style";

let intervalId: ReturnType<typeof setInterval> | null = null;
let cooldownEnd = 0; // ms timestamp when the user can send again

function getSlowmode(): number {
    const id = SelectedChannelStore.getChannelId?.();
    if (!id) return 0;
    const ch = ChannelStore.getChannel(id);
    return (ch as any)?.rateLimitPerUser ?? (ch as any)?.rate_limit_per_user ?? 0;
}

function getWrap(): HTMLElement | null {
    return document.getElementById(WRAP_ID);
}

function ensureWrap() {
    if (getWrap()) return;

    let style = document.getElementById(STYLE_ID);
    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${WRAP_ID} {
                position: absolute;
                bottom: 100%;
                left: 0;
                right: 0;
                height: 3px;
                border-radius: 2px;
                overflow: hidden;
                pointer-events: none;
                z-index: 10;
            }
            #${WRAP_ID} .sc-sm-bar {
                height: 100%;
                background: #f97316;
                transition: width 0.25s linear, background 0.4s;
            }
            #${WRAP_ID} .sc-sm-label {
                position: absolute;
                bottom: 4px;
                right: 8px;
                font-size: 0.62rem;
                font-family: 'JetBrains Mono', monospace;
                color: #f97316;
                pointer-events: none;
                letter-spacing: 0.04em;
            }
        `;
        document.head.appendChild(style);
    }

    const wrap = document.createElement("div");
    wrap.id = WRAP_ID;
    wrap.innerHTML = `<div class="sc-sm-bar" style="width:100%"></div><span class="sc-sm-label"></span>`;

    // Insert above the text area
    const textarea = document.querySelector<HTMLElement>(
        "[class*=\"textAreaSlate_\"], [class*=\"textArea_\"]"
    )?.parentElement;
    if (textarea) textarea.style.position = "relative";
    textarea?.appendChild(wrap);
}

function removeWrap() {
    document.getElementById(WRAP_ID)?.remove();
}

function tick() {
    const remaining = Math.max(0, cooldownEnd - Date.now());
    const slowmode  = getSlowmode();

    if (remaining <= 0 || slowmode <= 0) {
        removeWrap();
        return;
    }

    ensureWrap();
    const wrap = getWrap();
    if (!wrap) return;

    const bar   = wrap.querySelector<HTMLElement>(".sc-sm-bar");
    const label = wrap.querySelector<HTMLElement>(".sc-sm-label");
    const pct   = (remaining / (slowmode * 1000)) * 100;

    if (bar)   bar.style.width = `${pct}%`;
    if (label) label.textContent = `${Math.ceil(remaining / 1000)}s`;

    // Colour shifts red as time runs down
    const hue = Math.round(30 + pct * 0.9); // orange → yellow-green
    if (bar) bar.style.background = `hsl(${hue}, 95%, 55%)`;
}

function onMessageSent(event: any) {
    // Only trigger for your own sent messages, not everyone else's
    const me = UserStore.getCurrentUser();
    if (!me || event.message?.author?.id !== me.id) return;
    const slowmode = getSlowmode();
    if (slowmode <= 0) return;
    cooldownEnd = Date.now() + slowmode * 1000;
}

function onChannelSelect() {
    cooldownEnd = 0;
    removeWrap();
}

export default definePlugin({
    name: "SlowmodeCountdown",
    description: "Shows a live colour-shifting progress bar and countdown above the text box while you're under a slowmode cooldown.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageSent);
        FluxDispatcher.subscribe("CHANNEL_SELECT", onChannelSelect);
        intervalId = setInterval(tick, 250);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageSent);
        FluxDispatcher.unsubscribe("CHANNEL_SELECT", onChannelSelect);
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
        removeWrap();
        document.getElementById(STYLE_ID)?.remove();
    },
});
