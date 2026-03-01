/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-new-feature-badge";

const CSS = `
/* Discord adds these red/colored badges to advertise new features in the sidebar nav */
[class*="newBadge_"],
[class*="iconBadge_"][class*="numberBadge_"][class*="base_"]:not([class*="unread_"]):not([class*="mention_"]),
[class*="badge_"] > [class*="baseShapeRound_"][style*="background-color: rgb(240, 71, 71)"],
[class*="unreadPillCapContainer_"] [class*="unreadPill_"]:not([class*="unread_"]) {
    display: none !important;
}
/* "NEW" text pills on nav items */
[class*="newTag_"],
[class*="isNew_"] [class*="endDecorator_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoNewFeatureBadge",
    description: "Removes the red/colored \"NEW\" notification badges Discord adds to sidebar items when advertising new features.",
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
