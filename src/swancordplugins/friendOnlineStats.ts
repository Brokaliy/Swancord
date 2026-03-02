/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, GuildMemberStore, RelationshipStore, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    location: {
        type: OptionType.SELECT,
        description: "Where to show the online friend count",
        options: [
            { label: "Window title bar", value: "title", default: true },
            { label: "Both (title + home header)", value: "both" },
        ],
    },
    format: {
        type: OptionType.STRING,
        description: "Label format — use {online} and {total} placeholders",
        default: "👥 {online}/{total} online",
    },
});

const LABEL_ID = "swancord-friend-online-label";
let originalTitle = document.title;
let interval: ReturnType<typeof setInterval> | null = null;

function countOnlineFriends(): { online: number; total: number; } {
    const friends: string[] = (RelationshipStore as any).getFriendIDs?.() ?? [];
    const total = friends.length;
    let online = 0;
    friends.forEach((id: string) => {
        const status = (UserStore.getUser?.(id) as any)?.status ??
            (GuildMemberStore as any).getMember?.("", id)?.status ?? "";
        if (status !== "offline" && status !== "") online++;
    });
    return { online, total };
}

function update() {
    const { online, total } = countOnlineFriends();
    const label = settings.store.format
        .replace("{online}", String(online))
        .replace("{total}", String(total));

    const loc = settings.store.location;

    if (loc === "title" || loc === "both") {
        document.title = `${label} — Discord`;
    }

    if (loc === "both") {
        let el = document.getElementById(LABEL_ID);
        if (!el) {
            el = document.createElement("div");
            el.id = LABEL_ID;
            el.style.cssText = "font-size:12px;color:var(--text-muted,#a3a6aa);padding:4px 16px;font-weight:500;";
            const header = document.querySelector<HTMLElement>("[class*='homeWrapper_'], [class*='friendsColumn_']");
            header?.prepend(el);
        }
        el.textContent = label;
    }
}

function onPresenceUpdate() {
    update();
}

export default definePlugin({
    name: "FriendOnlineStats",
    description: "Displays how many of your friends are currently online in the window title or home header.",
    authors: [Devs._7n7],
    settings,

    start() {
        originalTitle = document.title;
        update();
        interval = setInterval(update, 30_000);
        FluxDispatcher.subscribe("PRESENCE_UPDATES", onPresenceUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("PRESENCE_UPDATES", onPresenceUpdate);
        if (interval) { clearInterval(interval); interval = null; }
        document.title = originalTitle;
        document.getElementById(LABEL_ID)?.remove();
    },
});
