/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-unreads";

// Hides the unread indicators on the guild list (the white dots on server icons)
// and the unread channel bolding. Does NOT hide mention badges (the red number pings).
const CSS = `
/* Guild list unread indicator dot */
[class*="unreadMentionsBar"],
[class*="lowerBadge"][class*="item_"],
[class*="upperBadge"][class*="item_"] {
    /* only hide the mention-less unread dot, not the ping badge */
}

/* Channel unread bold text & bar */
[class*="unread_"] [class*="name_"],
[class*="channel_"][class*="unread"] [class*="name_"] {
    font-weight: 400 !important;
    color: var(--channels-default, inherit) !important;
}

/* The left unread bar/pill on the guild icon */
[class*="blobContainer"] [class*="unreadPill"],
[class*="pill_"][class*="unread"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoUnreads",
    description: "Hides unread channel highlights and guild-list unread dots. You still see @mention badges — just not general unread indicators.",
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
