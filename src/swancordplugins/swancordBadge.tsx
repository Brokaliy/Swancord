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
import { shouldShowContributorBadge } from "@utils/misc";
import definePlugin from "@utils/types";

// Hardcoded IDs that get the "Swancord" badge.
// Add user IDs here for anyone who should have it.
const SWANCORD_BADGE_USERS = new Set<string>([
    "320171386016628747",
]);

const CREATOR_BADGE_ICON = "https://7n7.dev/badges/CreatorBadge.png";
const PERSONAL_7N7_ICON = "https://7n7.dev/badges/7n7Icon.png";
const TWINK_BADGE_ICON = "https://7n7.dev/badges/TwinkIcon.png";
const BUG_HUNTER_ICON = "https://7n7.dev/badges/BugHunterIcon.png";
const DONATOR_BADGE_ICON = "https://7n7.dev/badges/DonatorBadgeIcon.png";

// Add user IDs here for bug reporters
const BUG_HUNTER_USERS = new Set<string>([
    "320171386016628747",  // 7n7
    "1149839746588229754", // ujc2
]);

// Add user IDs here for donors
const DONATOR_USERS = new Set<string>([
]);

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
    onClick: () => window.open("https://7n7.dev/swancord/badges", "_blank"),
};

// Bug hunter badge — shown to users who reported bugs
const BugHunterBadge: ProfileBadge = {
    description: "Swancord Hunter",
    iconSrc: BUG_HUNTER_ICON,
    position: BadgePosition.START,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.9)",
        },
    },
    shouldShow: ({ userId }) => BUG_HUNTER_USERS.has(userId),
    onClick: () => window.open("https://7n7.dev/swancord/badges", "_blank"),
};

// Contributor badge — shown to Swancord plugin authors
const ContributorBadge: ProfileBadge = {
    description: "Swancord Contributor",
    iconSrc: "swancord:///assets/SwancordIcon.png",
    position: BadgePosition.START,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.9)",
        },
    },
    shouldShow: ({ userId }) => shouldShowContributorBadge(userId),
    onClick: () => window.open("https://7n7.dev/swancord/badges", "_blank"),
};

// Donator badge — shown to users who donated
const DonatorBadge: ProfileBadge = {
    description: "Swancord Donator",
    iconSrc: DONATOR_BADGE_ICON,
    position: BadgePosition.START,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.9)",
        },
    },
    shouldShow: ({ userId }) => DONATOR_USERS.has(userId),
    onClick: () => window.open("https://7n7.dev/swancord/badges", "_blank"),
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
        // Registered in reverse rarity order — BadgePosition.START prepends,
        // so the last registered badge appears first on the profile.
        addProfileBadge(BugHunterBadge);    // shown last
        addProfileBadge(ContributorBadge);  // shown before hunter
        addProfileBadge(DonatorBadge);      // shown before contributor
        addProfileBadge(Ujc2Badge);         // shown third
        addProfileBadge(SwancordBadge);     // shown second
        addProfileBadge(Personal7n7Badge);  // shown first
    },

    stop() {
        removeProfileBadge(BugHunterBadge);
        removeProfileBadge(ContributorBadge);
        removeProfileBadge(DonatorBadge);
        removeProfileBadge(Ujc2Badge);
        removeProfileBadge(SwancordBadge);
        removeProfileBadge(Personal7n7Badge);
    },
});
