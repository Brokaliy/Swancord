/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

// Discord message type IDs for boost-related system messages:
// 8  = USER_PREMIUM_GUILD_SUBSCRIPTION
// 9  = USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_1
// 10 = USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_2
// 11 = USER_PREMIUM_GUILD_SUBSCRIPTION_TIER_3
const BOOST_TYPES = new Set([8, 9, 10, 11]);

function interceptor(event: any) {
    if (
        event.type === "MESSAGE_CREATE" &&
        BOOST_TYPES.has(event.message?.type)
    ) {
        return false; // drop the event — message never enters the store
    }
}

export default definePlugin({
    name: "HideBoostMessages",
    description: "Drops server boost and level-up system messages before they're stored, so they never appear in chat.",
    authors: [Devs._7n7],

    start() {
        // addInterceptor returns before the event reaches reducers
        FluxDispatcher.addInterceptor(interceptor);
    },

    stop() {
        FluxDispatcher.removeInterceptor(interceptor);
    },
});
