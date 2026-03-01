/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

const MediaEngineStore = findByPropsLazy("isMute", "isDeaf");
const MediaEngineActions = findByPropsLazy("toggleSelfMute", "toggleSelfDeaf");

let prevChannelId: string | null = null;

function onVoiceChannelSelect({ channelId }: { channelId: string | null; }) {
    // Only act when joining (channelId goes from null → something)
    if (channelId && !prevChannelId) {
        // Mute if not already muted
        if (!MediaEngineStore.isMute()) {
            MediaEngineActions.toggleSelfMute();
        }
    }
    prevChannelId = channelId;
}

export default definePlugin({
    name: "MuteOnJoin",
    description: "Automatically mutes your microphone when you join a voice channel.",
    authors: [Devs._7n7],

    start() {
        prevChannelId = null;
        FluxDispatcher.subscribe("VOICE_CHANNEL_SELECT", onVoiceChannelSelect);
    },

    stop() {
        FluxDispatcher.unsubscribe("VOICE_CHANNEL_SELECT", onVoiceChannelSelect);
    },
});
