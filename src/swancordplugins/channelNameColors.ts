/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-channel-name-colors";

const settings = definePluginSettings({
    entries: {
        type: OptionType.STRING,
        description: "Format: channelId=#hexcolor, one per line. E.g.:\n123456789=#ff6b6b\n987654321=#6bcbff",
        default: "",
    },
});

function buildCSS(): string {
    const lines = settings.store.entries
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.includes("="));

    if (!lines.length) return "";

    return lines.map(line => {
        const [id, color] = line.split("=").map(s => s.trim());
        if (!id || !color) return "";
        return `
            /* Channel ID: ${id} */
            [data-list-item-id*="${id}"] [class*="name_"],
            [data-dnd-name="${id}"] [class*="channelName_"],
            li[id*="${id}"] [class*="name_"] {
                color: ${color} !important;
            }
        `;
    }).join("\n");
}

export default definePlugin({
    name: "ChannelNameColors",
    description: "Assign custom colors to specific channels by ID.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildCSS();
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
