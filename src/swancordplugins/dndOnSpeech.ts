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
    restoreAfter: {
        type: OptionType.BOOLEAN,
        description: "Restore your previous status when you stop speaking / leave voice",
        default: true,
    },
    requirePTT: {
        type: OptionType.BOOLEAN,
        description: "Only activate when using Push-to-Talk (ignore open-mic auto-speech)",
        default: false,
    },
});

let previousStatus: string | null = null;
let currentlySpeaking = false;

function setStatus(status: string) {
    FluxDispatcher.dispatch({
        type: "SELF_PRESENCE_STORE_UPDATE_HIDE_PRESENCE",
    });
    // Use the user settings proto route
    FluxDispatcher.dispatch({
        type: "USER_SETTINGS_PROTO_OVERWRITE_UPDATE",
        settings: { status },
    });
}

function onSpeaking(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me) return;
    const userId: string = event?.userId ?? event?.speakingUserId;
    if (userId !== me.id) return;

    const speaking: boolean = event?.speaking ?? event?.type === "SPEAKING_START";

    if (speaking && !currentlySpeaking) {
        currentlySpeaking = true;
        // Save current status before overriding
        previousStatus = (UserStore as any).getCurrentUser?.()?.status ?? "online";
        setStatus("dnd");
    } else if (!speaking && currentlySpeaking) {
        currentlySpeaking = false;
        if (settings.store.restoreAfter && previousStatus) {
            setStatus(previousStatus);
        }
        previousStatus = null;
    }
}

export default definePlugin({
    name: "DndOnSpeech",
    description: "Automatically sets your status to Do Not Disturb while you are actively speaking in a voice channel.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("SPEAKING", onSpeaking);
        FluxDispatcher.subscribe("VOICE_SPEAKING", onSpeaking);
    },

    stop() {
        FluxDispatcher.unsubscribe("SPEAKING", onSpeaking);
        FluxDispatcher.unsubscribe("VOICE_SPEAKING", onSpeaking);
        // Restore if still speaking when plugin disabled
        if (currentlySpeaking && settings.store.restoreAfter && previousStatus) {
            setStatus(previousStatus);
        }
        currentlySpeaking = false;
        previousStatus = null;
    },
});
