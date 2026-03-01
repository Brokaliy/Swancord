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
import { Patches } from "@utils/types";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

// Intercept Discord's sendMessage to default reply pings to OFF
const MessageActions = findByPropsLazy("sendMessage", "editMessage");

export default definePlugin({
    name: "ReplyPing",
    description: "Disables @mention in replies by default — you can still toggle it manually per-reply.",
    authors: [Devs._7n7],

    patches: [
        {
            // Discord's createPendingReply function sets shouldMention based on settings.
            // We override the default to false.
            find: "shouldMention",
            replacement: {
                match: /shouldMention:([A-Za-z_$.]+)\.shouldMention/,
                replace: "shouldMention:false",
            },
        },
    ],
});
