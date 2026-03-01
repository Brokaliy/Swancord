/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-server-banner";

export default definePlugin({
    name: "NoServerBanner",
    description: "Hides the server header banner image.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="banner_"][class*="guild"],
            [class*="guildBanner_"],
            [class*="bannerImg_"],
            [class*="header_"] [class*="banner_"] { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
