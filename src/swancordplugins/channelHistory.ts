/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";
import { findByPropsLazy } from "@webpack";

const RouterUtils = findByPropsLazy("transitionTo", "replaceWith", "getLastRouteChangeSource");

const history: string[] = [];
let pos = -1;
const MAX = 50;

function onChannelSelect(e: any) {
    if (!e?.channelId) return;
    // Trim forward history
    if (pos < history.length - 1) history.splice(pos + 1);
    history.push(e.channelId);
    if (history.length > MAX) history.shift();
    else pos++;
}

function onKeyDown(e: KeyboardEvent) {
    // Alt+Left = back, Alt+Right = forward (like browser)
    if (!e.altKey) return;
    if (e.code === "ArrowLeft" && pos > 0) {
        pos--;
        try { RouterUtils.transitionTo(`/channels/@me/${history[pos]}`); } catch (_) {}
        e.preventDefault();
    } else if (e.code === "ArrowRight" && pos < history.length - 1) {
        pos++;
        try { RouterUtils.transitionTo(`/channels/@me/${history[pos]}`); } catch (_) {}
        e.preventDefault();
    }
}

export default definePlugin({
    name: "ChannelHistory",
    description: "Alt+Left and Alt+Right to navigate back/forward through your recently viewed channels — like a browser.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("CHANNEL_SELECT", onChannelSelect);
        document.addEventListener("keydown", onKeyDown);
    },

    stop() {
        FluxDispatcher.unsubscribe("CHANNEL_SELECT", onChannelSelect);
        document.removeEventListener("keydown", onKeyDown);
        history.length = 0;
        pos = -1;
    },
});
