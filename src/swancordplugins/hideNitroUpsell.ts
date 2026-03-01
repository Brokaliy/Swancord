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

const STYLE_ID = "swancord-hide-nitro-upsell";

const CSS = `
/* Hide Nitro upsell / gift inventory banners */
[class*="premiumUpsell"],
[class*="nitroUpsell"],
[class*="premiumBanner"],
[class*="giftingPromoBanner"],
[class*="trialBanner"],
[class*="applicationStreamingUpsell"],
[class*="premiumGuildUpselll"],
[class*="nsfwGateBody"] [class*="nitro"],
[class*="boostBar"],
[data-list-item-id*="guild_header_boost"],
[class*="subscriptionUpsell"],
[class*="nitroMonthlySubscriptionUpsell"],
/* Sidebar Nitro Home / Gift Inventory links */
a[href*="/store"],
[data-list-item-id="guildsnav___guild-discovery-button"],
/* In-app gift and store icons that open Nitro shop */
[class*="giftCodeButton"],
[aria-label*="Gift Nitro"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "HideNitroUpsell",
    description: "Hides all Nitro upsell banners, boost prompts, and gift buttons so Discord stops begging you to subscribe.",
    authors: [Devs._7n7],

    start() {
        const el = document.createElement("style");
        el.id = STYLE_ID;
        el.textContent = CSS;
        document.head.appendChild(el);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
