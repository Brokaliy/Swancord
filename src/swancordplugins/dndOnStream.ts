/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher, UserStore } from "@webpack/common";

const StatusActions = findByPropsLazy("updateLocalSettings", "setLocalStatus");

const settings = definePluginSettings({
    streamStatus: {
        type: OptionType.SELECT,
        description: "Status to set while you are streaming",
        options: [
            { label: "Do Not Disturb", value: "dnd",      default: true },
            { label: "Idle",           value: "idle" },
            { label: "Invisible",      value: "invisible" },
        ],
    },
});

let previousStatus: string | null = null;
let streaming = false;

function onStreamCreate(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me || event?.userId !== me.id) return;
    if (streaming) return;
    streaming = true;

    try {
        const current = StatusActions.getLocalStatus?.() ?? "online";
        previousStatus = typeof current === "string" ? current : "online";
        StatusActions.updateLocalSettings({ status: settings.store.streamStatus });
    } catch {}
}

function onStreamEnd(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me || event?.userId !== me.id) return;
    if (!streaming) return;
    streaming = false;

    try {
        StatusActions.updateLocalSettings({ status: previousStatus ?? "online" });
        previousStatus = null;
    } catch {}
}

export default definePlugin({
    name: "DndOnStream",
    description: "Automatically sets DND (or another status) when you start screen sharing and restores it afterwards.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("STREAM_CREATE",  onStreamCreate);
        FluxDispatcher.subscribe("STREAM_DELETE",  onStreamEnd);
        FluxDispatcher.subscribe("STREAM_CLOSE",   onStreamEnd);
    },

    stop() {
        FluxDispatcher.unsubscribe("STREAM_CREATE",  onStreamCreate);
        FluxDispatcher.unsubscribe("STREAM_DELETE",  onStreamEnd);
        FluxDispatcher.unsubscribe("STREAM_CLOSE",   onStreamEnd);
        if (streaming && previousStatus) {
            try { StatusActions.updateLocalSettings({ status: previousStatus }); } catch {}
            streaming = false;
            previousStatus = null;
        }
    },
});
