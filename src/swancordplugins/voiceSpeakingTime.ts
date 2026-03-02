/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

// userId → { total ms speaking, speakingStart timestamp | null }
const speakingData = new Map<string, { totalMs: number; startedAt: number | null; }>();

const STYLE_ID = "swancord-voice-speaking-time";
const OVERLAY_ID = "swancord-speaking-time-overlay";

function getOrCreate(userId: string) {
    if (!speakingData.has(userId)) speakingData.set(userId, { totalMs: 0, startedAt: null });
    return speakingData.get(userId)!;
}

function fmtTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

let renderInterval: ReturnType<typeof setInterval> | null = null;

function onSpeaking(event: any) {
    const userId: string = event?.userId ?? event?.speakingUserId;
    const speaking: boolean = event?.speaking ?? event?.type === "SPEAKING_START";
    if (!userId) return;
    const d = getOrCreate(userId);
    if (speaking) {
        d.startedAt = Date.now();
    } else if (d.startedAt !== null) {
        d.totalMs += Date.now() - d.startedAt;
        d.startedAt = null;
    }
}

function renderOverlay() {
    const container = document.querySelector<HTMLElement>(
        "[class*='voiceCallWrapper_'], [class*='participantsContainer_']"
    );
    if (!container) return;

    const me = UserStore.getCurrentUser?.();
    if (!me) return;

    let overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = OVERLAY_ID;
        container.appendChild(overlay);
    }

    const now = Date.now();
    const lines: string[] = [];
    const userEls = container.querySelectorAll<HTMLElement>("[class*='participant_']");
    userEls.forEach(el => {
        const userId = (el as any).__reactFiber?.return?.stateNode?.props?.userId ??
            el.querySelector("[class*='voiceUser_']")?.getAttribute("data-user-id");
        if (!userId) return;
        const d = speakingData.get(userId);
        if (!d || d.totalMs === 0) return;
        const running = (d?.startedAt !== null && d?.startedAt != null)
            ? now - (d?.startedAt ?? now)
            : 0;
        const total = (d?.totalMs ?? 0) + running;
        if (total < 1000) return;
        const user = UserStore.getUser?.(userId);
        lines.push(`${user?.username ?? userId}: ${fmtTime(total)}`);
    });

    overlay.textContent = lines.join(" · ");
    overlay.style.cssText = "position:absolute;bottom:4px;left:0;right:0;text-align:center;"
        + "font-size:11px;color:var(--text-muted,#a3a6aa);pointer-events:none;padding:0 8px;z-index:10;";
}

export default definePlugin({
    name: "VoiceSpeakingTime",
    description: "Shows cumulative speaking time per user during active voice calls.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("SPEAKING", onSpeaking);
        FluxDispatcher.subscribe("VOICE_SPEAKING", onSpeaking);
        renderInterval = setInterval(renderOverlay, 1500);
    },

    stop() {
        FluxDispatcher.unsubscribe("SPEAKING", onSpeaking);
        FluxDispatcher.unsubscribe("VOICE_SPEAKING", onSpeaking);
        if (renderInterval) { clearInterval(renderInterval); renderInterval = null; }
        document.getElementById(OVERLAY_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
        speakingData.clear();
    },
});
