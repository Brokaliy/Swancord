/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, Toasts, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    userIds: {
        type: OptionType.STRING,
        description: "Comma-separated user IDs to watch — you'll get a toast when any of them come online",
        default: "",
    },
});

// Track previous statuses to detect online transitions
const prevStatus = new Map<string, string>();

function getWatchedIds(): Set<string> {
    return new Set(
        settings.store.userIds.split(",").map(s => s.trim()).filter(Boolean)
    );
}

function onPresenceUpdate(event: any) {
    const updates = event?.updates ?? [];
    const watched = getWatchedIds();
    for (const update of updates) {
        const userId: string = update.user?.id;
        if (!userId || !watched.has(userId)) continue;
        const newStatus: string = update.status ?? "offline";
        const old = prevStatus.get(userId) ?? "offline";
        if (old !== "online" && newStatus === "online") {
            // Friend just came online
            const username = UserStore.getUser?.(userId)?.username ?? userId;
            Toasts.show({
                message: `${username} is now online!`,
                type: Toasts.Type.MESSAGE,
                id: Toasts.genId(),
                options: { duration: 4000 },
            });
        }
        prevStatus.set(userId, newStatus);
    }
}

export default definePlugin({
    name: "FriendOnlineAlert",
    description: "Shows a toast notification when a watched friend comes online. Add their user IDs in settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        prevStatus.clear();
        FluxDispatcher.subscribe("PRESENCE_UPDATES", onPresenceUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("PRESENCE_UPDATES", onPresenceUpdate);
        prevStatus.clear();
    },
});
