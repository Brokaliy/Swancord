/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-friend-suggestions";

const CSS = `
/* "People You May Know" / friend suggestion rows on the Friends page */
[class*="friendSuggestion_"],
[class*="peopleListSectionTitle_"]:has(~ [class*="friendSuggestion_"]),
[class*="mayKnow_"],
[class*="friendsListItem_"][class*="suggestion_"],
/* "Add Friend" upsell row at bottom of friends list */
[class*="addFriendUpsell_"],
[class*="findFriendUpsell_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoFriendSuggestions",
    description: 'Hides the "People You May Know" friend suggestion section on the Friends page.',
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
