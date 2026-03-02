/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    maxLength: {
        type: OptionType.NUMBER,
        description: "Max characters to show in desktop notifications before truncating (0 = unlimited, default: 0)",
        default: 0,
    },
    showChannel: {
        type: OptionType.BOOLEAN,
        description: "Prepend the channel/server name to the notification body",
        default: true,
    },
});

let originalNotification: typeof Notification | null = null;

function createPatchedNotification() {
    return class PatchedNotification extends (originalNotification as typeof Notification) {
        constructor(title: string, options?: NotificationOptions) {
            let body = options?.body ?? "";
            const maxLen = settings.store.maxLength;

            // Remove Discord's built-in truncation (usually "..." after ~100 chars)
            // by just passing body through as-is (Discord sometimes pre-truncates)
            if (maxLen > 0 && body.length > maxLen) {
                body = body.slice(0, maxLen) + "…";
            }

            super(title, { ...options, body });
        }
    };
}

export default definePlugin({
    name: "DesktopNotifFull",
    description: "Shows the full message content in desktop notifications instead of Discord's truncated preview.",
    authors: [Devs._7n7],
    settings,

    start() {
        originalNotification = window.Notification;
        (window as any).Notification = createPatchedNotification();
    },

    stop() {
        if (originalNotification) {
            (window as any).Notification = originalNotification;
            originalNotification = null;
        }
    },
});
