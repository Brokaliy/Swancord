/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

interface OnlineEntry { userId: string; since: number; }
const onlineMap = new Map<string, number>();

function fmt(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function onPresenceUpdate(data: any) {
    const updates: any[] = data?.updates ?? [];
    for (const u of updates) {
        const id: string = u?.user?.id;
        if (!id) continue;
        const status: string = u?.status ?? "offline";
        if (status !== "offline") {
            if (!onlineMap.has(id)) onlineMap.set(id, Date.now());
        } else {
            onlineMap.delete(id);
        }
    }
}

function onPresencesReplace(data: any) {
    onlineMap.clear();
    const list: any[] = data?.presences ?? [];
    for (const p of list) {
        const id: string = p?.user?.id;
        if (id && (p?.status ?? "offline") !== "offline") {
            onlineMap.set(id, Date.now());
        }
    }
}

const TOOLTIP_ATTR = "data-online-since-tooltip";

function patchAvatars() {
    document.querySelectorAll<HTMLElement>("[class*='avatar_']").forEach(el => {
        if (el.dataset.onlineSincePatch) return;
        el.dataset.onlineSincePatch = "1";
        el.addEventListener("mouseenter", () => {
            // Try to find user id from nearby DOM (aria-label, data attributes, …)
            const userId = el.closest("[data-user-id]")?.getAttribute("data-user-id")
                ?? el.closest("[id*='userprofile']")?.id.replace(/\D/g, "");
            if (!userId) return;
            const ts = onlineMap.get(userId);
            if (!ts) return;
            el.setAttribute("title", `Online since ${fmt(ts)}`);
        });
    });
}

let patchInterval: ReturnType<typeof setInterval> | null = null;

export default definePlugin({
    name: "OnlineTimestamp",
    description: "Adds an 'Online since HH:MM' tooltip to user avatars (for users currently online). Tracks presence updates in session.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("PRESENCE_UPDATES", onPresenceUpdate);
        FluxDispatcher.subscribe("PRESENCES_REPLACE", onPresencesReplace);
        // Periodically patch any new avatars that enter the DOM
        patchInterval = setInterval(patchAvatars, 2000);
    },

    stop() {
        FluxDispatcher.unsubscribe("PRESENCE_UPDATES", onPresenceUpdate);
        FluxDispatcher.unsubscribe("PRESENCES_REPLACE", onPresencesReplace);
        if (patchInterval) { clearInterval(patchInterval); patchInterval = null; }
        onlineMap.clear();
        document.querySelectorAll("[data-online-since-tooltip]").forEach(el => {
            el.removeAttribute(TOOLTIP_ATTR);
        });
    },
});
