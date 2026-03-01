/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    userIds: {
        type: OptionType.STRING,
        description: "Comma-separated user IDs to follow. You'll be notified when they come online.",
        default: "",
    },
});

function getFollowedIds(): Set<string> {
    return new Set(
        settings.store.userIds.split(",").map(s => s.trim()).filter(Boolean)
    );
}

function onPresenceUpdate(e: any) {
    const updates = e?.updates ?? [];
    const followed = getFollowedIds();
    const me = UserStore.getCurrentUser?.()?.id;

    for (const update of updates) {
        if (!followed.has(update.user?.id)) continue;
        if (update.user?.id === me) continue;
        if (update.status !== "online" && update.status !== "idle") continue;

        const name = update.user?.username ?? update.user?.id;
        new Notification("User Online", {
            body: `${name} is now ${update.status}`,
            silent: false,
        });
    }
}

export default definePlugin({
    name: "FollowUser",
    description: "Get a desktop notification when specific users come online. Add their user IDs in plugin settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("PRESENCE_UPDATES", onPresenceUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("PRESENCE_UPDATES", onPresenceUpdate);
    },
});
