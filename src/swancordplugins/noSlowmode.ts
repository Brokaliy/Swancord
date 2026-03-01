/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-slowmode";

const CSS = `
/* Hide the slowmode cooldown countdown in the message box */
[class*="slowmodeCountdown"],
[class*="slowMode_"],
[class*="slowModeIndicator"],
[class*="cooldown_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoSlowmode",
    description: "Hides the slowmode countdown indicator in the message input area. The server slowmode is still enforced — this just removes the visual clutter.",
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
