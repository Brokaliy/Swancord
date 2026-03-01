/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-typing-dots";

const CSS = `
/* Freeze the bouncing typing indicator dots */
[class*="typingDots_"] [class*="dot_"],
[class*="typingDots_"] span {
    animation: none !important;
    opacity: 0.45 !important;
}
/* Optionally keep the text label but not the bouncing dots */
[class*="dots_"] span {
    animation: none !important;
}
`;

export default definePlugin({
    name: "NoTypingDots",
    description: "Stops the bouncing animation on the typing indicator dots — keeps the indicator visible but static.",
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
