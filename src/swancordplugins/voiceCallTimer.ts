/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * voiceCallTimer — per-user voice call duration timers
 *
 * Shows how long each person has been in the current voice channel.
 * Tracks join/move/leave events via Flux and injects live timer chips
 * next to each voice user row via MutationObserver.
 *
 * Original concept: AllCallTimeCounter by Max, nicola02nb, Witwitchy
 * Rewritten for Vencord / Swancord by 7n7 (1cwo)
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JoinData {
    channelId: string;
    guildId: string;
    time: number;
}

interface VoiceStatePayload {
    voiceStates: Array<{
        userId: string;
        channelId: string | null;
        oldChannelId?: string | null;
        guildId: string;
    }>;
}

interface PassiveUpdatePayload {
    guildId: string;
    voiceStates?: Array<{
        userId: string;
        channelId: string | null;
    }>;
}

// ─── Settings ────────────────────────────────────────────────────────────────

const settings = definePluginSettings({
    showWithoutHover: {
        type: OptionType.BOOLEAN,
        description: "Always show the timer (no hover required)",
        default: true,
    },
    trackSelf: {
        type: OptionType.BOOLEAN,
        description: "Show your own timer",
        default: true,
    },
    showSeconds: {
        type: OptionType.BOOLEAN,
        description: "Include seconds in the timer",
        default: true,
    },
    humanFormat: {
        type: OptionType.BOOLEAN,
        description: "Human-readable format  (e.g. 1h 2m 3s) instead of HH:mm:ss",
        default: false,
    },
});

// ─── State ────────────────────────────────────────────────────────────────────

const userJoinTimes = new Map<string, JoinData>();
let myLastChannelId: string | null = null;
let runOneTime = true; // first batch of VOICE_STATE_UPDATES on guild open is not a join
let ticker: ReturnType<typeof setInterval> | null = null;
let domObserver: MutationObserver | null = null;

const CHIP_ATTR = "data-vct-id";
const CHIP_STYLE_ID = "swancord-vct-style";

// ─── Flux handlers ────────────────────────────────────────────────────────────

function onVoiceStateUpdates({ voiceStates }: VoiceStatePayload) {
    const myId = UserStore.getCurrentUser().id;

    for (const state of voiceStates) {
        const { userId, channelId, guildId } = state;
        if (!guildId) continue;

        if (!("oldChannelId" in state) && !runOneTime) {
            // batch update from opening a guild — not a real join
            continue;
        }

        let { oldChannelId } = state as typeof state & { oldChannelId?: string | null };

        if (userId === myId && channelId !== myLastChannelId) {
            oldChannelId = myLastChannelId;
            myLastChannelId = channelId ?? null;
        }

        if (channelId !== oldChannelId) {
            if (channelId) {
                userJoinTimes.set(userId, { channelId, guildId, time: Date.now() });
            } else if (oldChannelId) {
                userJoinTimes.delete(userId);
            }
        }
    }
    runOneTime = false;
}

function onPassiveUpdate({ guildId, voiceStates }: PassiveUpdatePayload) {
    if (!voiceStates) return;

    // Remove users that left
    for (const [userId, data] of userJoinTimes) {
        if (data.guildId !== guildId) continue;
        if (!voiceStates.find(s => s.userId === userId)) {
            userJoinTimes.delete(userId);
        }
    }

    // Add/update users
    for (const state of voiceStates) {
        const { userId, channelId } = state;
        if (!channelId) continue;
        const existing = userJoinTimes.get(userId);
        if (!existing || existing.channelId !== channelId) {
            userJoinTimes.set(userId, { channelId, guildId, time: Date.now() });
        }
    }
}

// ─── Duration formatting ──────────────────────────────────────────────────────

function formatDuration(ms: number): string {
    const human = settings.store.humanFormat;
    const withSec = settings.store.showSeconds;
    const pad = (n: number) => human ? n : String(n).padStart(2, "0");
    const unit = (s: string) => human ? s : "";
    const sep = human ? " " : ":";

    const d = Math.floor(ms / 86_400_000);
    const h = Math.floor((ms % 86_400_000) / 3_600_000);
    const m = Math.floor(((ms % 86_400_000) % 3_600_000) / 60_000);
    const s = Math.floor((((ms % 86_400_000) % 3_600_000) % 60_000) / 1_000);

    let res = "";
    if (d) res += `${d}${unit("d")}${sep}`;
    if (h || res || !withSec) res += `${pad(h)}${unit("h")}${sep}`;
    if (m || res || (!human) || (!withSec)) res += `${pad(m)}${unit("m")}`;
    if (withSec && (m || res || !human)) res += sep;
    if (withSec) res += `${pad(s)}${unit("s")}`;
    return res;
}

// ─── DOM injection ────────────────────────────────────────────────────────────

/**
 * Resolve a user ID from a voice user row element.
 * Discord marks these with data-list-item-id="guild-voice-user-<guildId>_<userId>"
 */
function resolveUserId(el: HTMLElement): string | null {
    const raw = el.closest<HTMLElement>("[data-list-item-id*='_']")?.dataset.listItemId;
    if (raw) {
        const parts = raw.split("_");
        return parts.at(-1) ?? null;
    }
    // fallback: look for aria-label containing a username and cross-ref userJoinTimes
    return null;
}

function getOrCreateChip(row: HTMLElement, userId: string): HTMLElement {
    let chip = row.querySelector<HTMLElement>(`[${CHIP_ATTR}="${userId}"]`);
    if (!chip) {
        chip = document.createElement("span");
        chip.setAttribute(CHIP_ATTR, userId);
        chip.className = "vct-timer-chip";

        // Insert after username div if present, else append
        const un = row.querySelector<HTMLElement>("[class*='username_']");
        if (un?.parentElement) {
            un.after(chip);
        } else {
            row.appendChild(chip);
        }
    }
    return chip;
}

function refreshTimers() {
    const myId = UserStore.getCurrentUser().id;

    document
        .querySelectorAll<HTMLElement>("[data-list-item-id*='guild-voice-user-']")
        .forEach(row => {
            const uid = resolveUserId(row);
            if (!uid) return;

            if (uid === myId && !settings.store.trackSelf) {
                row.querySelector(`[${CHIP_ATTR}]`)?.remove();
                return;
            }

            const joinData = userJoinTimes.get(uid);
            if (!joinData) {
                row.querySelector(`[${CHIP_ATTR}]`)?.remove();
                return;
            }

            const chip = getOrCreateChip(row, uid);
            chip.textContent = formatDuration(Date.now() - joinData.time);
        });
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const TIMER_CSS = `
.vct-timer-chip {
    font-family: var(--font-code, monospace);
    font-size: 10px;
    line-height: 1;
    color: var(--channels-default);
    background: rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    padding: 1px 4px;
    margin-left: 4px;
    vertical-align: middle;
    display: inline-block;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    pointer-events: none;
}
`;

function injectCSS() {
    if (document.getElementById(CHIP_STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = CHIP_STYLE_ID;
    el.textContent = TIMER_CSS;
    document.head.appendChild(el);
}

function removeCSS() {
    document.getElementById(CHIP_STYLE_ID)?.remove();
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

function startObserver() {
    domObserver = new MutationObserver(() => refreshTimers());
    domObserver.observe(document.body, { childList: true, subtree: true });
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "VoiceCallTimer",
    description: "Shows how long each user has been in the current voice channel, next to their name.",
    authors: [Devs._7n7],
    settings,

    start() {
        injectCSS();
        startObserver();

        FluxDispatcher.subscribe("VOICE_STATE_UPDATES", onVoiceStateUpdates);
        FluxDispatcher.subscribe("PASSIVE_UPDATE_V1",   onPassiveUpdate);

        // Refresh every second
        ticker = setInterval(refreshTimers, 1000);
    },

    stop() {
        FluxDispatcher.unsubscribe("VOICE_STATE_UPDATES", onVoiceStateUpdates);
        FluxDispatcher.unsubscribe("PASSIVE_UPDATE_V1",   onPassiveUpdate);

        if (ticker) { clearInterval(ticker); ticker = null; }
        domObserver?.disconnect();
        domObserver = null;

        // Remove all injected chips
        document.querySelectorAll(`[${CHIP_ATTR}]`).forEach(el => el.remove());
        removeCSS();

        userJoinTimes.clear();
        myLastChannelId = null;
        runOneTime = true;
    },
});
