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

import { addProfileBadge, BadgePosition, ProfileBadge, removeProfileBadge } from "@api/Badges";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Hardcoded IDs that get the "Swancord" badge.
// Add user IDs here for anyone who should have it.
const SWANCORD_BADGE_USERS = new Set<string>([
    "320171386016628747",
]);

const CREATOR_BADGE_ICON = "swancord:///assets/CreatorBadge.png";
const PERSONAL_7N7_ICON = "swancord:///assets/7n7Icon.png";
const TWINK_BADGE_ICON = "swancord:///assets/TwinkIcon.png";

// Shown to everyone in SWANCORD_BADGE_USERS
const SwancordBadge: ProfileBadge = {
    description: "Swancord — discord.gg/swancord",
    iconSrc: CREATOR_BADGE_ICON,
    position: BadgePosition.START,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.9)",
        },
    },
    shouldShow: ({ userId }) => SWANCORD_BADGE_USERS.has(userId),
    onClick: () => {
        window.open("https://7n7.dev/swancord", "_blank");
    },
};

// ujc2 personal badge
const Ujc2Badge: ProfileBadge = {
    description: "Twink",
    iconSrc: TWINK_BADGE_ICON,
    position: BadgePosition.START,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.9)",
        },
    },
    shouldShow: ({ userId }) => userId === "1149839746588229754",
};

// Personal 7n7 badge — only shown on the creator's profile
const Personal7n7Badge: ProfileBadge = {
    description: "7n7 — 7n7.dev",
    iconSrc: PERSONAL_7N7_ICON,
    position: BadgePosition.START,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.9)",
        },
    },
    shouldShow: ({ userId }) => userId === "320171386016628747",
    onClick: () => {
        window.open("https://7n7.dev", "_blank");
    },
};

export default definePlugin({
    name: "SwancordBadge",
    description: "Adds custom Swancord and 7n7 badges to the creator's profile.",
    authors: [Devs._7n7],
    required: true,

    start() {
        addProfileBadge(SwancordBadge);
        addProfileBadge(Personal7n7Badge);
        addProfileBadge(Ujc2Badge);
    },

    stop() {
        removeProfileBadge(SwancordBadge);
        removeProfileBadge(Personal7n7Badge);
        removeProfileBadge(Ujc2Badge);
    },
});
