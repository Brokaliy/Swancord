/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

const MediaEngineStore = findByPropsLazy("isMute", "isDeaf");
const MediaEngineActions = findByPropsLazy("toggleSelfMute", "toggleSelfDeaf");

let prevChannelId: string | null = null;

function onVoiceChannelSelect({ channelId }: { channelId: string | null; }) {
    if (channelId && !prevChannelId) {
        // Just joined a voice channel — deafen if not already
        if (!MediaEngineStore.isDeaf()) {
            MediaEngineActions.toggleSelfDeaf();
        }
    }
    prevChannelId = channelId;
}

export default definePlugin({
    name: "VoiceAutoDeafen",
    description: "Automatically deafens your audio whenever you join a voice channel.",
    authors: [Devs._7n7],

    start() {
        prevChannelId = null;
        FluxDispatcher.subscribe("VOICE_CHANNEL_SELECT", onVoiceChannelSelect);
    },

    stop() {
        FluxDispatcher.unsubscribe("VOICE_CHANNEL_SELECT", onVoiceChannelSelect);
    },
});
