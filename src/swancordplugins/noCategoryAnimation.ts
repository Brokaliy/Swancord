/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-category-animation";

const CSS = `
/* Remove expand/collapse slide animation from channel categories */
[class*="containerDefault_"],
[class*="channels_"] [class*="container_"],
[class*="categoryCollapse_"],
[class*="collapseButton_"],
[class*="channel_"] {
    transition: none !important;
    animation-duration: 0s !important;
}
/* Also remove height transitions on list items */
[class*="listItem_"] {
    transition: none !important;
}
`;

export default definePlugin({
    name: "NoCategoryAnimation",
    description: "Removes the slide animation when collapsing or expanding channel categories.",
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
