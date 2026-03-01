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

const ReactionActions = findByPropsLazy("addReaction", "removeReaction");

const settings = definePluginSettings({
    keyword: {
        type: OptionType.STRING,
        description: "Keyword to trigger an auto-react (case-insensitive, leave blank to disable)",
        default: "",
    },
    emoji: {
        type: OptionType.STRING,
        description: "Emoji to react with when keyword is found (e.g. 👍 or a custom name like \"pepe\")",
        default: "👍",
    },
    ownMessages: {
        type: OptionType.BOOLEAN,
        description: "Also react to your own messages",
        default: false,
    },
});

function onMessage(event: any) {
    const msg = event?.message;
    if (!msg) return;
    const keyword = settings.store.keyword.trim().toLowerCase();
    if (!keyword) return;

    const me = UserStore.getCurrentUser?.();
    if (!settings.store.ownMessages && msg.author?.id === me?.id) return;

    const content = (msg.content ?? "").toLowerCase();
    if (!content.includes(keyword)) return;

    const emoji = settings.store.emoji.trim();
    if (!emoji) return;

    // Determine if it's a unicode emoji or custom name
    const isUnicode = /\p{Emoji}/u.test(emoji);
    try {
        if (isUnicode) {
            ReactionActions.addReaction(msg.channel_id, msg.id, { name: emoji });
        } else {
            ReactionActions.addReaction(msg.channel_id, msg.id, { name: emoji, id: null });
        }
    } catch { /* reaction may fail silently */ }
}

export default definePlugin({
    name: "AutoReact",
    description: "Automatically reacts with an emoji when a message contains your configured keyword.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
    },
});
