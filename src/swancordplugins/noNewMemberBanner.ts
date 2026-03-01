/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-new-member-banner";

export default definePlugin({
    name: "NoNewMemberBanner",
    description: "Hides the \"Welcome to the server\" new member spotlight banners in chat.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="newMemberBanner_"],
            [class*="systemMessage_"][class*="joinedGuild"],
            [class*="welcomeMessage_"],
            [class*="newMemberCard_"] { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
