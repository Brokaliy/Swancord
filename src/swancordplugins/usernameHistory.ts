/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { DataStore } from "@api/index";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const STORE_KEY = "UsernameHistory";

interface HistoryEntry { username: string; timestamp: number; }

const settings = definePluginSettings({
    maxEntries: {
        type: OptionType.NUMBER,
        description: "Maximum history entries to keep",
        default: 50,
    },
});

let history: HistoryEntry[] = [];
let currentUsername = "";

async function load() {
    history = (await DataStore.get<HistoryEntry[]>(STORE_KEY)) ?? [];
}

async function save() {
    await DataStore.set(STORE_KEY, history);
}

function onCurrentUserUpdate(data: any) {
    const newName: string = data?.user?.username ?? data?.username ?? "";
    if (!newName || newName === currentUsername) return;
    if (currentUsername) {
        history.unshift({ username: currentUsername, timestamp: Date.now() });
        const max = settings.store.maxEntries ?? 50;
        if (history.length > max) history = history.slice(0, max);
        save();
    }
    currentUsername = newName;
}

export default definePlugin({
    name: "UsernameHistory",
    description: "Locally logs every username you've used and the timestamp. View history in plugin settings.",
    authors: [Devs._7n7],
    settings,

    async start() {
        await load();
        FluxDispatcher.subscribe("USER_SETTINGS_UPDATE", onCurrentUserUpdate);
        FluxDispatcher.subscribe("CURRENT_USER_UPDATE", onCurrentUserUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("USER_SETTINGS_UPDATE", onCurrentUserUpdate);
        FluxDispatcher.unsubscribe("CURRENT_USER_UPDATE", onCurrentUserUpdate);
    },

    getHistory(): HistoryEntry[] {
        return history;
    },

    clearHistory() {
        history = [];
        save();
    },
});
