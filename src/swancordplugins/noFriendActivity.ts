/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-friend-activity";

export default definePlugin({
    name: "NoFriendActivity",
    description: "Hides the friend activity / Now Playing panel on the right side of the screen.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="nowPlayingColumn"],
            [class*="activityPanel_"],
            [class*="activityFeed_"],
            [aria-label="Now Playing"],
            [class*="friendsOnlinePanel"] { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
