/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-better-codeblocks";

const CSS = `
/* Better code block styling */
[class*="codeContainer_"],
[class*="markup_"] pre {
    border-radius: 8px !important;
    padding: 14px 16px !important;
    font-size: 0.82rem !important;
    line-height: 1.55 !important;
    tab-size: 4 !important;
}

/* Language label pill */
[class*="codeContainer_"] + span,
[class*="scrollbarGhostHairline_"],
[class*="code-actions"] {
    opacity: 0.6 !important;
    font-size: 0.7rem !important;
}

/* Wrap long lines instead of horizontal scroll */
[class*="hljs"],
[class*="markup_"] pre code {
    white-space: pre-wrap !important;
    word-break: break-word !important;
}

/* Slightly brighter syntax colors on dark background */
[class*="markup_"] pre .hljs-keyword    { color: #c0c0c0 !important; }
[class*="markup_"] pre .hljs-string     { color: #aaaaaa !important; }
[class*="markup_"] pre .hljs-comment    { color: #555555 !important; font-style: italic !important; }
[class*="markup_"] pre .hljs-number     { color: #d0d0d0 !important; }
[class*="markup_"] pre .hljs-function   { color: #e0e0e0 !important; }
`;

export default definePlugin({
    name: "BetterCodeBlocks",
    description: "Improves code block styling: better padding, line wrapping, and monochromatic syntax highlighting.",
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
