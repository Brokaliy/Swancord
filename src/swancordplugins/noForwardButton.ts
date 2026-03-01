/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-forward-button";

// Hide the "Forward Message" button that appears in the message toolbar
const CSS = `
[class*="buttonContainer_"] [aria-label="Forward Message"],
[class*="message-actions"] [aria-label="Forward Message"],
button[aria-label="Forward Message"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoForwardButton",
    description: "Hides the Forward Message button from the message action toolbar.",
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
