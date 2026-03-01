/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-gif-suggestions";

const CSS = `
/* GIF autocomplete row that appears when you type search terms */
[class*="gifPicker_"],
[class*="trendingContainer_"],
[class*="gifSuggestions_"],
[class*="utteranceContainer_"] [class*="gifIcon_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoGifSuggestions",
    description: "Hides GIF suggestion autocomplete that appears while typing.",
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
