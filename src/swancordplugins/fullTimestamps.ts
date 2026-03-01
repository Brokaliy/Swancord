/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-full-timestamps";

// Force the timestamp to always display inline rather than only on hover.
// Discord only renders the timestamp element on hover via CSS opacity tricks.
const CSS = `
/* Always show message timestamps (removes hover-only opacity) */
[class*="timestamp_"][class*="hidden_"],
[class*="timestampVisibleOnHover_"],
[class*="messageTimestamp_"] {
    display: inline !important;
    opacity: 0.5 !important;
    visibility: visible !important;
}
[class*="messageTimestamp_"]:hover {
    opacity: 0.8 !important;
}
`;

export default definePlugin({
    name: "FullTimestamps",
    description: "Makes message timestamps always visible instead of only appearing on hover.",
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
