/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-nitro-ads";

const CSS = `
/* "Get Nitro" upsell banner in the sidebar, gift icon in chat bar,
   and subscribe/upgrade prompts scattered across the UI */
[class*="premiumBanner_"],
[class*="upsellContainer_"],
[class*="upsellOverlay_"],
[class*="nitroUpsell_"],
[class*="giftCodeUpsell_"],
[aria-label="Gift Nitro"],
button[aria-label="Gift Nitro"],
[class*="nitroInChat_"],
[class*="premiumPromotionBanner_"],
[class*="promotionBanner_"],
div[class*="container_"][class*="premium_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoNitroAds",
    description: "Hides all Nitro upsell/advertisement banners and buttons throughout Discord.",
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
