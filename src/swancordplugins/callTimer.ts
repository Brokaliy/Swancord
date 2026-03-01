/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const TIMER_ID = "swancord-call-timer";

let startTime: number | null = null;
let interval: ReturnType<typeof setInterval> | null = null;

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmt(ms: number) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

function getOrCreateEl(): HTMLDivElement | null {
    let el = document.getElementById(TIMER_ID) as HTMLDivElement | null;
    if (el) return el;

    const panel = document.querySelector<HTMLElement>("[class*='connection_'], [class*='rtcConnection']");
    if (!panel) return null;

    el = document.createElement("div");
    el.id = TIMER_ID;
    Object.assign(el.style, {
        fontSize: "0.72rem",
        color: "rgba(255,255,255,0.45)",
        textAlign: "center",
        padding: "2px 0 4px",
        fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.04em",
        fontFamily: "var(--font-code, monospace)",
    });
    panel.appendChild(el);
    return el;
}

function tick() {
    if (startTime == null) return;
    const el = getOrCreateEl();
    if (el) el.textContent = fmt(Date.now() - startTime);
}

function onVoiceJoin(e: any) {
    if (e?.channelId) {
        startTime = Date.now();
        interval ??= setInterval(tick, 1000);
    }
}

function onVoiceLeave(e: any) {
    if (!e?.channelId) {
        startTime = null;
        document.getElementById(TIMER_ID)?.remove();
    }
}

export default definePlugin({
    name: "CallTimer",
    description: "Shows an elapsed time counter in the voice panel while you're in a call.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("VOICE_CHANNEL_SELECT", onVoiceJoin);
        FluxDispatcher.subscribe("VOICE_CHANNEL_SELECT", onVoiceLeave);
    },

    stop() {
        FluxDispatcher.unsubscribe("VOICE_CHANNEL_SELECT", onVoiceJoin);
        FluxDispatcher.unsubscribe("VOICE_CHANNEL_SELECT", onVoiceLeave);
        if (interval) { clearInterval(interval); interval = null; }
        document.getElementById(TIMER_ID)?.remove();
        startTime = null;
    },
});
