/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";
import { findByPropsLazy } from "@webpack";

const MessageActions = findByPropsLazy("deleteMessage", "sendMessage");

const settings = definePluginSettings({
    delaySeconds: {
        type: OptionType.NUMBER,
        description: "Seconds after sending before your message is auto-deleted (0 = disabled).",
        default: 0,
    },
    keyword: {
        type: OptionType.STRING,
        description: "Only auto-delete messages containing this word (leave empty to delete all).",
        default: "",
    },
});

function onMessageCreate(e: any) {
    const msg = e?.message;
    if (!msg) return;
    const me = UserStore.getCurrentUser?.();
    if (!me || msg.author?.id !== me.id) return;

    const delay = settings.store.delaySeconds;
    if (!delay || delay <= 0) return;

    const kw = settings.store.keyword.trim().toLowerCase();
    if (kw && !msg.content?.toLowerCase().includes(kw)) return;

    setTimeout(async () => {
        try {
            await MessageActions.deleteMessage(msg.channel_id, msg.id);
        } catch (_) {}
    }, delay * 1000);
}

export default definePlugin({
    name: "AutoDeleteMessage",
    description: "Automatically deletes your own messages after a set number of seconds. Configure delay and optional keyword filter in settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
    },
});
