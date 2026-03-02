/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-hypesquad";

const CSS = `
/* HypeSquad house badges on user profiles and members list */
[class*="badge_"][aria-label*="HypeSquad"],
[class*="profileBadge_"][class*="hypesquad"],
[class*="hypesquad"],
[class*="hypeSquad"],
svg[class*="hypesquad"],
[aria-label="HypeSquad Bravery"],
[aria-label="HypeSquad Brilliance"],
[aria-label="HypeSquad Balance"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoHypeSquad",
    description: "Hides HypeSquad house badges (Bravery, Brilliance, Balance) from user profiles and member lists.",
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
