/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-boost-bar";

const CSS = `
/* Server boost progress bar above channel list */
[class*="boostingUpsell"],
[class*="boostBar_"],
[class*="tierHeaderContainer"],
[class*="boostsRequired"],
[class*="premiumSubscriberCount"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoBoostBar",
    description: "Hides the server boost progress bar that appears above the channel list.",
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
