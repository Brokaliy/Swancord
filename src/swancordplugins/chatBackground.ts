/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-chat-background";

const settings = definePluginSettings({
    color: {
        type: OptionType.STRING,
        description: "CSS background value for the chat area (hex color, gradient, or url())",
        default: "#060606",
    },
});

export default definePlugin({
    name: "ChatBackground",
    description: "Set a custom background color, gradient, or image for the chat area.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        const bg = settings.store.color || "#060606";
        style.textContent = `
            [class*="chat_"],
            [class*="chatContent_"],
            [class*="chatLayer_"] { background: ${bg} !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
