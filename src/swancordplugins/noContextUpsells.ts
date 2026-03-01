/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-ctx-upsells";

const CSS = `
/* Remove "Boost Server" and "Get Nitro" items from right-click context menus */
[id="boost-server"],
[id*="premium"],
[aria-label*="Boost"],
[class*="menu_"] [id*="boost"],
[class*="premiumItem"] {
    display: none !important;
}

/* Remove the "Apps" submenu divider when apps are hidden */
[class*="menu_"] [role="separator"]:last-child {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoContextUpsells",
    description: "Removes Nitro/Boost upsell items from right-click context menus.",
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
