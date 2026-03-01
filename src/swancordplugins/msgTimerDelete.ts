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

const MessageActions = findByPropsLazy("deleteMessage", "startEditMessage");

const settings = definePluginSettings({
    delaySecs: {
        type: OptionType.NUMBER,
        description: "Auto-delete your own messages after this many seconds (0 = disabled)",
        default: 0,
    },
});

// Tracks whether the next MESSAGE_CREATE from the current user should be scheduled for deletion
let pendingDelete = false;

function onMessageCreate(event: any) {
    const delay = settings.store.delaySecs;
    if (!delay || !pendingDelete) return;

    const me = UserStore.getCurrentUser?.();
    const msg = event?.message;
    if (!msg || msg.author?.id !== me?.id) return;

    pendingDelete = false;
    const { channel_id, id } = msg;

    setTimeout(() => {
        try { MessageActions.deleteMessage(channel_id, id); } catch { /* silent */ }
    }, delay * 1000);
}

export default definePlugin({
    name: "MsgTimerDelete",
    description: "Automatically deletes your sent messages after a configurable delay (in seconds).",
    authors: [Devs._7n7],
    dependencies: ["MessageEventsAPI"],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
    },

    onBeforeMessageSend(_channelId: string, _msg: any) {
        if (settings.store.delaySecs > 0) pendingDelete = true;
    },
});
