/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    selfOnly: {
        type: OptionType.BOOLEAN,
        description: "Only alert when someone reacts to YOUR messages",
        default: true,
    },
    ignoreSelf: {
        type: OptionType.BOOLEAN,
        description: "Ignore your own reactions",
        default: true,
    },
});

function onReaction(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me) return;

    if (settings.store.ignoreSelf && event?.userId === me.id) return;

    // Only alert on own messages when selfOnly is enabled
    if (settings.store.selfOnly && event?.messageAuthorId !== me.id) return;

    const emoji = event?.emoji;
    if (!emoji) return;

    const emojiDisplay = emoji.id
        ? `:${emoji.name}:`
        : (emoji.name ?? "?");

    const reactor = UserStore.getUser?.(event.userId)?.username ?? event.userId;

    showNotification({
        title: "New Reaction",
        body: `${reactor} reacted ${emojiDisplay} to your message`,
        onClick: () => {
            // Navigate to the message channel if possible
        },
    });
}

export default definePlugin({
    name: "ReactionAlert",
    description: "Sends a desktop notification when someone reacts to your messages.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_REACTION_ADD", onReaction);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_REACTION_ADD", onReaction);
    },
});
