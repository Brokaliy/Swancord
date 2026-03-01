/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-banner-profile";

export default definePlugin({
    name: "NoBannerProfile",
    description: "Hides profile banners in user popouts and profile modals.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="userPopout"] [class*="banner_"],
            [class*="profilePanel"] [class*="banner_"],
            [class*="userProfile"] [class*="banner_"],
            [class*="profileBanner_"],
            [class*="avatarPositionPanel_"] ~ [class*="banner_"] { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
