/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const TITLE_SUFFIX_ID = "sc-server-status";
let originalTitle = "";
let lastCount = -1;

function getMemberCounts(): { online: number; total: number; } | null {
    // Try to read from the member list DOM
    const countEl = document.querySelector<HTMLElement>(
        "[class*='membersGroup_'], [class*='memberCount_']"
    );
    if (countEl) {
        const text = countEl.textContent ?? "";
        const nums = text.match(/\d+/g)?.map(Number) ?? [];
        if (nums.length >= 2) return { online: nums[0], total: nums[1] };
        if (nums.length === 1) return { online: nums[0], total: nums[0] };
    }
    return null;
}

function updateTitle() {
    const counts = getMemberCounts();
    if (!counts) {
        if (lastCount !== -1) {
            document.title = originalTitle;
            lastCount = -1;
        }
        return;
    }
    if (counts.online === lastCount) return;
    lastCount = counts.online;
    if (!originalTitle) originalTitle = document.title;
    const base = originalTitle.replace(/ \[\d+.*?\]$/, "");
    document.title = `${base} [${counts.online} online]`;
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

function onGuildSelect() {
    // Reset so we pick up the new server's count
    lastCount = -1;
    setTimeout(updateTitle, 500);
}

export default definePlugin({
    name: "ServerStatusBar",
    description: "Shows the online member count of the current server in the window title as '[N online]'.",
    authors: [Devs._7n7],

    start() {
        originalTitle = document.title;
        FluxDispatcher.subscribe("GUILD_SELECT", onGuildSelect);
        pollInterval = setInterval(updateTitle, 3000);
        setTimeout(updateTitle, 1000);
    },

    stop() {
        FluxDispatcher.unsubscribe("GUILD_SELECT", onGuildSelect);
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        document.title = originalTitle || document.title.replace(/ \[\d+.*?\]$/, "");
        lastCount = -1;
    },
});
