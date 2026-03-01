/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-send-button";

const CSS = `
/* Hide the send message button — keyboard-only workflow */
button[aria-label="Send Message"],
[class*="sendButton_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoSendButton",
    description: "Hides the send button in the chat bar. Press Enter to send.",
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
