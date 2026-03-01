/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-discord-ai";

const CSS = `
/* AI grammar suggestions, Clyde AI button, AI recap, message actions AI */
[class*="aiGrammar_"],
[class*="clydeAvatar_"],
[class*="aiActions_"],
[class*="aiLabel_"],
[class*="aiRecap_"],
[class*="recapItem_"],
[aria-label*="AI"],
[aria-label*="Clyde"],
button[aria-label="AI Responses"],
[class*="aiButton_"],
[class*="builtInSeparator_"] ~ [class*="channel_"][data-dnd-name="Clyde AI"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoDiscordAI",
    description: "Hides all Discord AI features — Clyde AI, grammar suggestions, AI summaries, and AI action buttons.",
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
