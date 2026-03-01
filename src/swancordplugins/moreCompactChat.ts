/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-more-compact-chat";

const CSS = `
/* Ultra-compact message list — tighter than Discord's built-in Compact mode */
[class*="messageListItem_"] {
    margin-block: 0 !important;
}
[class*="cozy_"][class*="message_"] {
    padding-top: 1px !important;
    padding-bottom: 1px !important;
    min-height: unset !important;
}
[class*="compact_"][class*="message_"] {
    padding-top: 0px !important;
    padding-bottom: 0px !important;
    line-height: 1.3 !important;
}
/* Tighten avatar area in cozy mode */
[class*="avatar_"][class*="cozy_"] {
    margin-top: 2px !important;
}
`;

export default definePlugin({
    name: "MoreCompactChat",
    description: "Reduces message padding to an ultra-compact view, fitting more messages on screen.",
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
