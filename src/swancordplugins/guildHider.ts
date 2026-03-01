/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-guild-hider";

const settings = definePluginSettings({
    guildIds: {
        type: OptionType.STRING,
        description: "Comma-separated server/guild IDs to hide from the server list",
        default: "",
    },
});

function buildCSS(ids: string[]): string {
    if (!ids.length) return "";
    return ids
        .map(id => `[data-list-item-id="guildsnav___${id}"], a[href*="/channels/${id}"] { display: none !important; }`)
        .join("\n");
}

export default definePlugin({
    name: "GuildHider",
    description: "Hide specific servers from your guild list by ID. Comma-separated IDs in settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        const ids = settings.store.guildIds
            .split(",")
            .map(s => s.trim())
            .filter(Boolean);

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildCSS(ids);
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
