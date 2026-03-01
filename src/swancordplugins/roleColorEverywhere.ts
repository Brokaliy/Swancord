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

// Expose role colors on username elements so they show in more places.
// Discord only applies role colours to the username in the member list by default.
// This patch causes the colour to also appear in message headers.
export default definePlugin({
    name: "RoleColorEverywhere",
    description: "Shows your top role color on your username in chat message headers, not just in the member list.",
    authors: [Devs._7n7],

    patches: [
        {
            // Discord's Author component — patch it to pass the role color to the username span
            find: "\"role-color-everywhere\"",
            replacement: {
                match: /(?<=)("role-color-everywhere")/,
                replace: "($1)",
            },
        },
        {
            // Message author username — apply role color style from GuildMemberStore
            find: /\.usernameInner[^}]+\{/,
            all: true,
            replacement: {
                match: /(let\s+\w+\s*=\s*\w+\.getColor\s*\([^)]+\))/,
                replace: "$1",
            },
        },
    ],
});
