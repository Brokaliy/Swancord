/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-emoji-size";

const settings = definePluginSettings({
    size: {
        type: OptionType.NUMBER,
        description: "Emoji size in pixels (default: 22)",
        default: 22,
    },
    largeEmojiSize: {
        type: OptionType.NUMBER,
        description: "Size in pixels for large (solo) emoji (default: 48)",
        default: 48,
    },
});

function buildCSS() {
    const s = settings.store.size;
    const l = settings.store.largeEmojiSize;
    return `
        /* Inline emoji in messages */
        [class*="emoji"][class*="jumboable_"],
        img[class*="emoji"] {
            width: ${s}px !important;
            height: ${s}px !important;
        }
        /* Large "jumbo" emoji when message contains only emoji */
        [class*="jumboEmoji_"] img[class*="emoji"],
        [class*="emojiContainer_"] img[class*="emoji"] {
            width: ${l}px !important;
            height: ${l}px !important;
        }
    `;
}

export default definePlugin({
    name: "EmojiSize",
    description: "Customise the size of inline emoji in messages.",
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
