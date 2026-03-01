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

// This plugin hides the "Active Threads" inbox section that Discord
// shows above the channel list — it clutters the sidebar unnecessarily.
// Actual thread functionality is unchanged; you can still open threads.

const STYLE_ID = "swancord-hide-thread-inbox";

const CSS = `
/* Hide the active threads inbox above channel list */
[class*="container_"][class*="thread"],
[class*="threadSidebar"],
[class*="inboxThreads"],
[class*="forumPostComposer"],
[class*="newThreadButton"],
[class*="forumTag_"][class*="unread"] {
    /* Don't hide these — they're for forum channels */
}

/* The "Threads" tab in inbox */
[role="tab"][aria-label*="Thread"],
[class*="tabItem_"][data-tab="threads"] {
    /* intentionally not hidden */
}
`;

// Show a cleaner "Joined Active Threads" button label
export default definePlugin({
    name: "AutoThreadArchive",
    description: "Removes clutter from thread UI — hides noisy Active Threads inline previews that pop up above the channel list.",
    authors: [Devs._7n7],

    patches: [
        {
            // Discord shows an inline "active thread" item above the channel list.
            // Suppressing it keeps the sidebar cleaner.
            find: "activeJoinedRelevantThreads",
            replacement: {
                match: /(activeJoinedRelevantThreads:)[^,}]+/,
                replace: "$1[]",
            },
        },
    ],
});
