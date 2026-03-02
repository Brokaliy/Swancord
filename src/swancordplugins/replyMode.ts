/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const settings = definePluginSettings({
    defaultMention: {
        type: OptionType.BOOLEAN,
        description: "Default to mentioning users when replying (can be overridden per-reply; this sets the global default)",
        default: true,
    },
    perServer: {
        type: OptionType.BOOLEAN,
        description: "Remember the last mention choice per server and restore it for the next reply",
        default: true,
    },
});

// guildId → last shouldMention value
const serverPrefs = new Map<string, boolean>();

function onReplyCreate(event: any) {
    if (!settings.store.perServer) return;
    const guildId: string | undefined = event?.guildId;
    if (!guildId) return;
    // Persist whatever the user chose last time
    if (typeof event?.shouldMention === "boolean") {
        serverPrefs.set(guildId, event.shouldMention);
    }
}

function onReplyCancel() {
    // nothing to do here
}

function onReplyInterceptDispatch(dispatch: (action: any) => void, action: any) {
    if (action.type !== "SET_PENDING_REPLY") return dispatch(action);
    const guildId: string | undefined = action?.reply?.channel?.guild_id;

    if (settings.store.perServer && guildId && serverPrefs.has(guildId)) {
        action = { ...action, shouldMention: serverPrefs.get(guildId) };
    } else if (!settings.store.perServer) {
        action = { ...action, shouldMention: settings.store.defaultMention };
    }
    return dispatch(action);
}

let _origDispatch: ((a: any) => void) | null = null;

export default definePlugin({
    name: "ReplyMode",
    description: "Remembers your mention/no-mention reply preference per server and restores it for the next reply.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("SET_PENDING_REPLY", onReplyCreate);
        FluxDispatcher.subscribe("DELETE_PENDING_REPLY", onReplyCancel);
    },

    stop() {
        FluxDispatcher.unsubscribe("SET_PENDING_REPLY", onReplyCreate);
        FluxDispatcher.unsubscribe("DELETE_PENDING_REPLY", onReplyCancel);
        serverPrefs.clear();
    },
});
