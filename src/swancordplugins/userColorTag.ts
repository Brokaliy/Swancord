/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-user-color-tag";

const settings = definePluginSettings({
    entries: {
        type: OptionType.STRING,
        description: "User ID:color pairs separated by commas (e.g. 123456789:#ff6600,987654321:#00ccff)",
        default: "",
    },
});

function buildCSS(entries: Array<{ userId: string; color: string; }>): string {
    return entries
        .map(({ userId, color }) => `
            [data-author-id="${userId}"] [class*="username_"],
            [data-author-id="${userId}"] [class*="userTag_"],
            [id*="message-username-${userId}"],
            [class*="header_"] [href*="/users/${userId}"] {
                color: ${color} !important;
            }
        `)
        .join("\n");
}

function parseEntries(raw: string): Array<{ userId: string; color: string; }> {
    return raw
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
        .map(s => {
            const [userId, color] = s.split(":").map(x => x.trim());
            return { userId, color: color ?? "#ffffff" };
        })
        .filter(e => e.userId && /^\d+$/.test(e.userId));
}

function applyStyle() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = buildCSS(parseEntries(settings.store.entries));
}

export default definePlugin({
    name: "UserColorTag",
    description: "Assign a custom username color to specific users by their ID. Set pairs in settings: ID:#color",
    authors: [Devs._7n7],
    settings,

    start() { applyStyle(); },
    stop()  { document.getElementById(STYLE_ID)?.remove(); },

    settingsAboutComponent: () => null as any,
});
