/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    threshold: {
        type: OptionType.NUMBER,
        description: "Number of a single emoji reaction needed to auto-pin the message",
        default: 5,
    },
    emoji: {
        type: OptionType.STRING,
        description: "Emoji name that triggers auto-pin (e.g. 📌 or \"pin\"). Leave blank for any emoji.",
        default: "📌",
    },
});

const pinned = new Set<string>();

async function onReaction(event: any) {
    const { channelId, messageId, emoji, count } = event ?? {};
    if (!channelId || !messageId) return;

    const targetEmoji = settings.store.emoji.trim();
    if (targetEmoji && emoji?.name !== targetEmoji) return;

    const hitCount = (count ?? 1) >= settings.store.threshold;
    if (!hitCount) return;
    if (pinned.has(messageId)) return;
    pinned.add(messageId);

    try {
        const { RestAPI } = await import("@webpack/common") as any;
        await RestAPI.put({ url: `/channels/${channelId}/pins/${messageId}` });
    } catch { pinned.delete(messageId); }
}

export default definePlugin({
    name: "AutoPin",
    description: "Auto-pins messages when they reach a set number of a specific reaction (default: 5 × 📌).",
    authors: [Devs._7n7],
    settings,

    start() {
        pinned.clear();
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", onReaction);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_ADD", onReaction);
        pinned.clear();
    },
});
