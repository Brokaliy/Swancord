/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-app-directory";

const CSS = `
/* App Directory / Discover Apps button in sidebar */
[class*="listItem_"] a[href*="/app-directory"],
[class*="listItem_"] a[href*="/discovery"],
[aria-label="App Directory"],
[aria-label="Discover Apps"],
[class*="appDirectoryIcon_"],
[data-list-item-id*="app-directory"],
[data-list-item-id*="discover-apps"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoAppDirectory",
    description: "Removes the App Directory / Discover Apps button from the sidebar navigation.",
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
