/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-hide-activity";

const CSS = `
/* Hide "Playing X" and "Watching X" activity labels in the member list */
[class*="activity_"],
[class*="activityName_"],
[class*="gameIcon_"],
[class*="richActivity"],
[class*="activityText_"] {
    display: none !important;
}

/* Keep the status dot but remove the game text in user areas */
[class*="userActivity"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "HideActivity",
    description: "Hides game/activity status text (Playing, Watching, etc.) from the member list and user panels to reduce visual noise.",
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
