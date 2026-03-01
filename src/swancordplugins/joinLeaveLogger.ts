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

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, FluxDispatcher, UserStore, VoiceStateStore } from "@webpack/common";

const settings = definePluginSettings({
    onlyCurrentChannel: {
        type: OptionType.BOOLEAN,
        description: "Only log joins/leaves in the voice channel you are currently in",
        default: true,
    },
    logSelf: {
        type: OptionType.BOOLEAN,
        description: "Also show a notification when you yourself join or leave",
        default: false,
    },
});

function onVoiceStateUpdate({ voiceStates }: { voiceStates: Array<{ userId: string; channelId: string | null; oldChannelId?: string | null; guildId?: string; }>; }) {
    const me = UserStore.getCurrentUser();
    if (!me) return;

    const myChannelId = VoiceStateStore.getVoiceStateForUser(me.id)?.channelId;

    for (const state of voiceStates) {
        const { userId, channelId, oldChannelId } = state;

        if (!settings.store.logSelf && userId === me.id) continue;

        const user = UserStore.getUser(userId);
        const username = user?.username ?? `User ${userId}`;

        const joined = channelId && !oldChannelId;
        const left = !channelId && oldChannelId;
        const moved = channelId && oldChannelId && channelId !== oldChannelId;

        if (!joined && !left && !moved) continue;

        if (settings.store.onlyCurrentChannel && myChannelId) {
            const relevant = channelId === myChannelId || oldChannelId === myChannelId;
            if (!relevant) continue;
        }

        const channelName = (channelId ? ChannelStore.getChannel(channelId) : ChannelStore.getChannel(oldChannelId!))?.name ?? "Unknown";

        if (joined) {
            showNotification({ title: "VC Join", body: `${username} joined #${channelName}`, color: "#4ade80" });
        } else if (left) {
            showNotification({ title: "VC Leave", body: `${username} left #${channelName}`, color: "#f87171" });
        } else if (moved) {
            const toChannel = ChannelStore.getChannel(channelId!)?.name ?? "Unknown";
            showNotification({ title: "VC Move", body: `${username} → #${toChannel}`, color: "#facc15" });
        }
    }
}

export default definePlugin({
    name: "JoinLeaveLogger",
    description: "Shows desktop notifications when users join, leave, or switch voice channels.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
    },
});
