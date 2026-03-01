/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, Toasts, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    userIds: {
        type: OptionType.STRING,
        description: "Comma-separated user IDs to watch for typing. Leave blank to watch all (noisy).",
        default: "",
    },
    ignoreSelf: {
        type: OptionType.BOOLEAN,
        description: "Ignore your own typing events",
        default: true,
    },
});

// Debounce: don't fire more than once per 8 s per user
const lastAlerted = new Map<string, number>();
const DEBOUNCE_MS = 8000;

function onTypingStart(event: any) {
    const userId: string = event?.userId;
    if (!userId) return;

    const me = UserStore.getCurrentUser?.();
    if (settings.store.ignoreSelf && userId === me?.id) return;

    const watched = settings.store.userIds
        .split(",").map(s => s.trim()).filter(Boolean);
    if (watched.length && !watched.includes(userId)) return;

    const now = Date.now();
    if ((lastAlerted.get(userId) ?? 0) + DEBOUNCE_MS > now) return;
    lastAlerted.set(userId, now);

    const user = UserStore.getUser?.(userId);
    const name = user?.username ?? userId;

    Toasts.show({
        message: `✏️ ${name} is typing…`,
        type: Toasts.Type.MESSAGE,
        id: Toasts.genId(),
        options: { duration: 3000 },
    });
}

export default definePlugin({
    name: "TypingAlert",
    description: "Shows a toast notification when a watched user starts typing anywhere you can see.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("TYPING_START", onTypingStart);
    },

    stop() {
        FluxDispatcher.unsubscribe("TYPING_START", onTypingStart);
        lastAlerted.clear();
    },
});
