/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-hide-channels";

const settings = definePluginSettings({
    channelIds: {
        type: OptionType.STRING,
        description: "Comma-separated channel IDs to hide from the sidebar.",
        default: "",
        onChange: applyHides,
    },
});

function applyHides() {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    const ids = settings.store.channelIds.split(",").map(s => s.trim()).filter(Boolean);

    if (!ids.length) {
        style?.remove();
        return;
    }

    if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
    }

    style.textContent = ids.map(id =>
        `[data-list-item-id*="${id}"], [id*="${id}"] { display: none !important; }`
    ).join("\n");
}

export default definePlugin({
    name: "HideChannelByID",
    description: "Hides specific channels from the sidebar by their channel IDs. Configure IDs in plugin settings.",
    authors: [Devs._7n7],
    settings,

    start() { applyHides(); },
    stop() { document.getElementById(STYLE_ID)?.remove(); },
});
