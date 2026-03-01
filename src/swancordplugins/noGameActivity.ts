/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

// Subscribe to LOCAL_ACTIVITY_UPDATE; when game activity (type 0) fires,
// immediately dispatch a null activity on the next tick to clear it.
let suppressing = false;

function onActivityUpdate(e: any) {
    if (suppressing) return;
    if (e?.activity?.type === 0) {
        suppressing = true;
        setTimeout(() => {
            FluxDispatcher.dispatch({
                type: "LOCAL_ACTIVITY_UPDATE",
                activity: null,
                socketId: "NoGameActivity",
            });
            suppressing = false;
        }, 0);
    }
}

export default definePlugin({
    name: "NoGameActivity",
    description: "Prevents Discord from broadcasting your game activity — clears game presence as soon as it's detected.",
    authors: [Devs._7n7],

    start() {
        suppressing = false;
        FluxDispatcher.subscribe("LOCAL_ACTIVITY_UPDATE", onActivityUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("LOCAL_ACTIVITY_UPDATE", onActivityUpdate);
        suppressing = false;
    },
});
