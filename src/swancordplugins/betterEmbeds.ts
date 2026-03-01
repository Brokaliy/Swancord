/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-better-embeds";

const CSS = `
/* Tighten up embed padding */
[class*="embed_"],
[class*="embedWrapper_"] {
    border-radius: 6px !important;
    padding: 10px 14px !important;
    max-width: 520px !important;
}

/* Left accent border */
[class*="embedColorPill_"] {
    border-radius: 2px !important;
    width: 3px !important;
}

/* Embed title */
[class*="embedTitle_"] {
    font-size: 0.9rem !important;
    font-weight: 700 !important;
}

/* Embed description */
[class*="embedDescription_"] {
    font-size: 0.82rem !important;
    line-height: 1.4 !important;
    opacity: 0.85 !important;
}

/* Embed thumbnail smaller */
[class*="embedThumbnail_"] img {
    max-width: 70px !important;
    max-height: 70px !important;
    border-radius: 4px !important;
}

/* Embed footer */
[class*="embedFooter_"] {
    font-size: 0.72rem !important;
    opacity: 0.55 !important;
    margin-top: 6px !important;
}
`;

export default definePlugin({
    name: "BetterEmbeds",
    description: "Cleans up link embed styling — tighter padding, smaller thumbnails, better typography.",
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
