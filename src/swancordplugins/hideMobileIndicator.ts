/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-hide-mobile";

const CSS = `
/* Hide the phone/mobile indicator badge on avatars in the member list */
[class*="mobileIcon"],
[class*="mobile_"][class*="status"],
[class*="statusIcon"][class*="mobile"],
[class*="statusTooltip"][class*="mobile"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "HideMobileIndicator",
    description: "Hides the mobile phone badge shown on users accessing Discord from their phone.",
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
