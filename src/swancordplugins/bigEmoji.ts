/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-big-emoji";

// Makes single-emoji-only messages display at jumbo size, like Discord used to default to.
const CSS = `
[class*="messageContent_"][class*="jumboifiable"] img[class*="emoji"],
[class*="emoji"][class*="jumboEmoji"],
[class*="emojiContainer"][class*="large"] img {
    width: 48px !important;
    height: 48px !important;
    min-width: 48px !important;
}
`;

export default definePlugin({
    name: "BigEmoji",
    description: "Displays single-emoji messages at a larger jumbo size.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
