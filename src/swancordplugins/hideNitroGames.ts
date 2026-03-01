/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-hide-nitro-games";

const CSS = `
/* Nitro Games library, Activity feed, and Games tab in sidebar */
[class*="libraryTab_"],
[class*="gamesTab_"],
a[href="/library"],
a[href="/activity"],
[data-list-item-id*="library"],
[data-list-item-id*="activity"],
[class*="libraryContainer_"],
[class*="nowPlayingColumn_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "HideNitroGames",
    description: "Hides the Nitro Games / Activity library tab from the sidebar.",
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
