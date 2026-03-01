/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-compact-dms";

const settings = definePluginSettings({
    height: {
        type: OptionType.NUMBER,
        description: "DM entry height in pixels (default Discord is ~42px, try 28-34 for compact)",
        default: 30,
    },
});

function buildCSS(h: number) {
    return `
        /* DM / group-DM entries in the sidebar */
        [class*="privateChannelsHeaderContainer_"] ~ [class*="scroller_"] [class*="channel_"],
        [class*="privateChannels_"] [class*="channel_"],
        nav[class*="privateChannels_"] li {
            min-height: ${h}px !important;
            height: ${h}px !important;
        }
        nav[class*="privateChannels_"] li [class*="avatar_"] {
            width:  ${Math.round(h * 0.71)}px !important;
            height: ${Math.round(h * 0.71)}px !important;
        }
    `;
}

export default definePlugin({
    name: "CompactDMs",
    description: "Reduces the height of DM sidebar entries so you can see more conversations at once.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildCSS(settings.store.height);
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
