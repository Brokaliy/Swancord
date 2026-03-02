/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const STYLE_ID = "swancord-thread-count";

const settings = definePluginSettings({
    activeOnly: {
        type: OptionType.BOOLEAN,
        description: "Only count active (unarchived) threads",
        default: true,
    },
    badgeColor: {
        type: OptionType.STRING,
        description: "Badge background color (CSS color value, default: #5865f2)",
        default: "#5865f2",
    },
});

// channelId → thread count
const threadCounts = new Map<string, number>();

const CSS = `
.swancord-thread-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    background: var(--swancord-thread-badge-color, #5865f2);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    line-height: 1;
    padding: 0 4px;
    margin-left: 5px;
    vertical-align: middle;
    pointer-events: none;
}
`;

function updateBadges() {
    const color = settings.store.badgeColor || "#5865f2";
    document.querySelectorAll<HTMLElement>("[class*='channelName_'], [class*='name_'][class*='channel_']").forEach(el => {
        const li = el.closest<HTMLElement>("[data-list-item-id]");
        if (!li) return;
        const channelId = li.dataset.listItemId?.replace(/^.*___/, "") ?? "";
        const count = threadCounts.get(channelId) ?? 0;

        let badge = el.parentElement?.querySelector<HTMLElement>(".swancord-thread-badge");
        if (count > 0) {
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "swancord-thread-badge";
                el.after(badge);
            }
            badge.style.background = color;
            badge.textContent = String(count > 99 ? "99+" : count);
        } else {
            badge?.remove();
        }
    });
}

function onThreadListSync(event: any) {
    const threads: any[] = event?.threads ?? event?.activeThreads ?? [];
    threads.forEach(t => {
        if (!t.parent_id) return;
        if (settings.store.activeOnly && t.thread_metadata?.archived) return;
        const cur = threadCounts.get(t.parent_id) ?? 0;
        threadCounts.set(t.parent_id, cur + 1);
    });
    updateBadges();
}

function onThreadCreate(event: any) {
    const t = event?.thread;
    if (!t?.parent_id) return;
    threadCounts.set(t.parent_id, (threadCounts.get(t.parent_id) ?? 0) + 1);
    updateBadges();
}

function onThreadDelete(event: any) {
    const parentId: string = event?.thread?.parent_id ?? event?.parent_id;
    if (!parentId) return;
    const cur = threadCounts.get(parentId) ?? 0;
    if (cur > 0) threadCounts.set(parentId, cur - 1);
    updateBadges();
}

let badgeInterval: ReturnType<typeof setInterval> | null = null;

export default definePlugin({
    name: "ThreadCount",
    description: "Shows a live thread-count badge next to channel names in the sidebar.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);

        FluxDispatcher.subscribe("THREAD_LIST_SYNC", onThreadListSync);
        FluxDispatcher.subscribe("THREAD_CREATE", onThreadCreate);
        FluxDispatcher.subscribe("THREAD_DELETE", onThreadDelete);
        FluxDispatcher.subscribe("THREAD_UPDATE", updateBadges);

        badgeInterval = setInterval(updateBadges, 10_000);
    },

    stop() {
        FluxDispatcher.unsubscribe("THREAD_LIST_SYNC", onThreadListSync);
        FluxDispatcher.unsubscribe("THREAD_CREATE", onThreadCreate);
        FluxDispatcher.unsubscribe("THREAD_DELETE", onThreadDelete);
        FluxDispatcher.unsubscribe("THREAD_UPDATE", updateBadges);
        if (badgeInterval) { clearInterval(badgeInterval); badgeInterval = null; }
        document.getElementById(STYLE_ID)?.remove();
        document.querySelectorAll(".swancord-thread-badge").forEach(el => el.remove());
        threadCounts.clear();
    },
});
