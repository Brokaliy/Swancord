/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-chat-font-size";

const settings = definePluginSettings({
    size: {
        type: OptionType.NUMBER,
        description: "Font size for chat messages in pixels (default: 16)",
        default: 16,
    },
});

export default definePlugin({
    name: "ChatFontSize",
    description: "Set a custom font size for chat messages. Re-enable after changing the setting.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        const size = settings.store.size || 16;
        style.textContent = `
            [class*="markup_"],
            [class*="messageContent_"] {
                font-size: ${size}px !important;
                line-height: ${Math.round(size * 1.375)}px !important;
            }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
