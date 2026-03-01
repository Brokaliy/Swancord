/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-message-spacing";

const settings = definePluginSettings({
    lineHeight: {
        type: OptionType.NUMBER,
        description: "Line height multiplier for message text (e.g. 1.6 for 60% extra space)",
        default: 1.5,
    },
    gap: {
        type: OptionType.NUMBER,
        description: "Extra vertical padding between messages in pixels",
        default: 2,
    },
});

export default definePlugin({
    name: "MessageSpacing",
    description: "Adjust line height and vertical padding between chat messages.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        const lh = settings.store.lineHeight || 1.5;
        const gap = settings.store.gap ?? 2;
        style.textContent = `
            [class*="markup_"],
            [class*="messageContent_"] { line-height: ${lh} !important; }
            [class*="message_"]:not([class*="messageListItem"]) {
                padding-top: ${gap}px !important;
                padding-bottom: ${gap}px !important;
            }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
