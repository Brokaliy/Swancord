/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, MessageStore, Toasts, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    showEmoji: {
        type: OptionType.BOOLEAN,
        description: "Include the reaction emoji in the notification",
        default: true,
    },
    ignoreSelfReact: {
        type: OptionType.BOOLEAN,
        description: "Don't notify when you react to your own message",
        default: true,
    },
    debounceMs: {
        type: OptionType.NUMBER,
        description: "Minimum milliseconds between notifications for the same message (default: 5000)",
        default: 5000,
    },
});

const lastNotified = new Map<string, number>();

function onReactionAdd(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me) return;

    const userId: string = event?.userId;
    if (settings.store.ignoreSelfReact && userId === me.id) return;

    const channelId: string = event?.channelId;
    const messageId: string = event?.messageId;
    if (!channelId || !messageId) return;

    // Check if it's our message
    const msg = MessageStore.getMessage?.(channelId, messageId);
    if (!msg || msg.author?.id !== me.id) return;

    const key = `${channelId}-${messageId}`;
    const now = Date.now();
    const debounce = Math.max(0, settings.store.debounceMs);
    if ((lastNotified.get(key) ?? 0) + debounce > now) return;
    lastNotified.set(key, now);

    const reactor = UserStore.getUser?.(userId);
    const reactorName = reactor?.username ?? userId;
    const emoji = event?.emoji?.name ?? "";
    const msg2 = settings.store.showEmoji && emoji
        ? `${reactorName} reacted ${emoji} to your message`
        : `${reactorName} reacted to your message`;

    Toasts.show({
        message: msg2,
        type: Toasts.Type.MESSAGE,
        id: Toasts.genId(),
        options: { duration: 4000 },
    });
}

export default definePlugin({
    name: "ReactionNotif",
    description: "Shows a toast notification when someone reacts to one of your messages.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", onReactionAdd);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_ADD", onReactionAdd);
        lastNotified.clear();
    },
});
