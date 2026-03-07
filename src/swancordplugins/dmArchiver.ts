/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as DataStore from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher, Toasts } from "@webpack/common";

const DS_KEY = "DmArchiver_lastOpened";

// Map of channelId → last opened timestamp (ms)
let lastOpened: Record<string, number> = {};
let checkInterval: ReturnType<typeof setInterval> | null = null;

const PrivateChannelStore = findByPropsLazy("getPrivateChannelIds", "getSortedPrivateChannels");

const settings = definePluginSettings({
    threshold: {
        type: OptionType.NUMBER,
        description: "Auto-mute DMs with no activity after this many days",
        default: 30,
    },
    showToast: {
        type: OptionType.BOOLEAN,
        description: "Show a toast when DMs are auto-muted",
        default: true,
    },
    checkOnStartup: {
        type: OptionType.BOOLEAN,
        description: "Run the archive check when Discord starts",
        default: true,
    },
});

function muteDM(channelId: string) {
    FluxDispatcher.dispatch({
        type: "CHANNEL_NOTIFICATIONS_UPDATE",
        channelId,
        settings: {
            muted: true,
            mute_config: {
                selected_time_window: -1,
                end_time: null,
            },
        },
    });
}

async function runArchive() {
    const threshold = (settings.store.threshold ?? 30) * 24 * 60 * 60 * 1000;
    const now = Date.now();

    let channels: string[] = [];
    try {
        channels = PrivateChannelStore?.getPrivateChannelIds?.() ?? [];
    } catch {
        return;
    }

    const stale = channels.filter(id => {
        const last = lastOpened[id];
        if (!last) return false; // never tracked = don't archive
        return now - last > threshold;
    });

    if (stale.length === 0) return;

    for (const id of stale) {
        muteDM(id);
    }

    if (settings.store.showToast) {
        Toasts.show({
            message: `DM Archiver: muted ${stale.length} inactive DM${stale.length !== 1 ? "s" : ""}`,
            type: Toasts.Type.MESSAGE,
            id: Toasts.genId(),
        });
    }
}

function onChannelSelect({ channelId }: { channelId: string; }) {
    if (!channelId) return;
    lastOpened[channelId] = Date.now();
    DataStore.set(DS_KEY, lastOpened).catch(() => { });
}

export default definePlugin({
    name: "DmArchiver",
    description: `Auto-mutes DMs you haven't opened in X days (configurable). Tracks which DMs you've visited and silently mutes the stale ones on startup.`,
    authors: [Devs._7n7],
    settings,

    async start() {
        lastOpened = (await DataStore.get<Record<string, number>>(DS_KEY)) ?? {};

        FluxDispatcher.subscribe("CHANNEL_SELECT", onChannelSelect);

        if (settings.store.checkOnStartup) {
            // Small delay so Discord finishes loading stores
            setTimeout(runArchive, 8000);
        }

        // Re-check every 6 hours while Discord is open
        checkInterval = setInterval(runArchive, 6 * 60 * 60 * 1000);
    },

    stop() {
        FluxDispatcher.unsubscribe("CHANNEL_SELECT", onChannelSelect);
        if (checkInterval !== null) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    },
});
