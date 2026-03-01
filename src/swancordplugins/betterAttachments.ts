/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-better-attachments";

const CSS = `
/* Rounded corners on all media attachments */
[class*="imageWrapper_"] img,
[class*="imageContainer_"] img,
[class*="mediaAttachment"] img,
[class*="mediaAttachmentItem"] img {
    border-radius: 8px !important;
}

/* Video attachments */
[class*="mediaAttachment"] video {
    border-radius: 8px !important;
}

/* File attachment cards */
[class*="fileAttachment_"],
[class*="downloadButton"],
[class*="attachment_"] {
    border-radius: 8px !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    padding: 10px 14px !important;
}

/* Subtle shadow on images */
[class*="imageWrapper_"] img {
    box-shadow: 0 2px 12px rgba(0,0,0,0.4) !important;
}

/* Limit auto-preview image height to prevent massive images */
[class*="messageAttachment"] img:not([class*="emoji"]) {
    max-height: 400px !important;
    object-fit: contain !important;
}
`;

export default definePlugin({
    name: "BetterAttachments",
    description: "Adds rounded corners, subtle shadows, and a max height to images and file attachments in chat.",
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
