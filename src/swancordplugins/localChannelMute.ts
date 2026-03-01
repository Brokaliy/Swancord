/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, Toasts } from "@webpack/common";

const DS_KEY   = "SwancordLocalMute_v1";
const STYLE_ID = "swancord-local-mute";

// Set of channel IDs that are locally muted
let mutedChannels = new Set<string>();

async function load() {
    const saved: string[] = (await DataStore.get(DS_KEY)) ?? [];
    mutedChannels = new Set(saved);
    applyCSS();
}

async function persist() {
    await DataStore.set(DS_KEY, [...mutedChannels]);
}

function applyCSS() {
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style") as HTMLStyleElement;
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    // Hide unread indicators for locally muted channels
    const rules = [...mutedChannels].map(id => `
        [data-list-item-id*="${id}"] [class*="unread_"],
        [data-list-item-id*="${id}"] [class*="mentionsBadge_"],
        [data-list-item-id*="${id}"] [class*="numberBadge_"] { display: none !important; }
    `);
    el.textContent = rules.join("\n");
}

function toggle(channelId: string) {
    if (mutedChannels.has(channelId)) {
        mutedChannels.delete(channelId);
        Toasts.show({ id: Toasts.genId(), message: "Channel un-muted locally.", type: Toasts.Type.SUCCESS });
    } else {
        mutedChannels.add(channelId);
        Toasts.show({ id: Toasts.genId(), message: "Channel muted locally (no unread badge).", type: Toasts.Type.SUCCESS });
    }
    applyCSS();
    persist();
}

// Keyboard shortcut: Ctrl+Alt+M to toggle mute for current channel
function onKey(e: KeyboardEvent) {
    if (!e.ctrlKey || !e.altKey || e.key !== "m") return;
    e.preventDefault();
    // Get current channel from the URL
    const match = window.location.pathname.match(/\/channels\/[^/]+\/(\d+)/);
    if (!match) return;
    toggle(match[1]);
}

export default definePlugin({
    name: "LocalChannelMute",
    description: "Press Ctrl+Alt+M to locally mute a channel (hides its unread/mention badge). Persists across restarts.",
    authors: [Devs._7n7],

    async start() {
        await load();
        document.addEventListener("keydown", onKey, true);
    },

    stop() {
        document.removeEventListener("keydown", onKey, true);
        document.getElementById(STYLE_ID)?.remove();
    },
});
