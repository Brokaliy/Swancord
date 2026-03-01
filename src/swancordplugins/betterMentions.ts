/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-better-mentions";

const settings = definePluginSettings({
    color: {
        type: OptionType.STRING,
        description: "Background color for your own @mention highlight (CSS color value)",
        default: "rgba(250, 166, 26, 0.15)",
    },
    borderColor: {
        type: OptionType.STRING,
        description: "Left-border accent color for your own mention",
        default: "#faa61a",
    },
});

function buildCSS() {
    return `
        /* Highlight messages that mention you with a distinct left-border + background */
        [class*="mentioned_"] [class*="message_"] {
            background-color: ${settings.store.color} !important;
            border-left: 3px solid ${settings.store.borderColor} !important;
            padding-left: 8px !important;
        }
        /* Keep the mention chip itself clearly visible */
        [class*="mentioned_"] [class*="mention_"] {
            font-weight: 700 !important;
            opacity: 1 !important;
        }
    `;
}

export default definePlugin({
    name: "BetterMentions",
    description: "Adds a configurable background + left-border accent to messages that @ mention you.",
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
