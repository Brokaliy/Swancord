/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, Toasts } from "@webpack/common";

const settings = definePluginSettings({
    reminderMins: {
        type: OptionType.NUMBER,
        description: "Show a reminder toast after being deafened for this many minutes (0 = disabled)",
        default: 30,
    },
});

let deafenedAt: number | null = null;
let checkInterval: ReturnType<typeof setInterval> | null = null;

function onToggle(event: any) {
    // AUDIO_TOGGLE_SELF_DEAF fires with { deaf: boolean }
    if (event?.deaf === true) {
        deafenedAt = Date.now();
    } else {
        deafenedAt = null;
    }
}

function checkDeafen() {
    const mins = settings.store.reminderMins;
    if (!mins || deafenedAt === null) return;
    const elapsed = (Date.now() - deafenedAt) / 60000;
    if (elapsed >= mins) {
        deafenedAt = null; // reset so it only fires once until deafened again
        Toasts.show({
            message: `🔇 You've been deafened for ${Math.floor(elapsed)} minutes.`,
            type: Toasts.Type.FAILURE,
            id: Toasts.genId(),
            options: { duration: 6000 },
        });
    }
}

export default definePlugin({
    name: "VoiceDeafenReminder",
    description: "Sends a toast reminder if you've been self-deafened for too long.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("AUDIO_TOGGLE_SELF_DEAF", onToggle);
        checkInterval = setInterval(checkDeafen, 60_000);
    },

    stop() {
        FluxDispatcher.unsubscribe("AUDIO_TOGGLE_SELF_DEAF", onToggle);
        if (checkInterval) { clearInterval(checkInterval); checkInterval = null; }
        deafenedAt = null;
    },
});
