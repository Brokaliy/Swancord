/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-hover-preview";

export default definePlugin({
    name: "NoHoverPreview",
    description: "Disables the user profile popout that appears when hovering over usernames in chat.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="userPopout"],
            [class*="hoverCard_"],
            [class*="popout_"][class*="profile"] { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
