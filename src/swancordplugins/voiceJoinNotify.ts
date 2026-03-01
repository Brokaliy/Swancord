/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, FluxDispatcher, GuildMemberStore, GuildStore, UserStore, VoiceStateStore } from "@webpack/common";

function onVoiceStateUpdate(e: any) {
    if (!e?.voiceStates) return;
    const me = UserStore.getCurrentUser?.();
    if (!me) return;

    for (const state of e.voiceStates) {
        // Skip our own state changes
        if (state.userId === me.id) continue;
        // Only care if they just joined a channel we're in
        if (!state.channelId) continue;

        const myState = VoiceStateStore?.getVoiceStateForUser?.(me.id);
        if (!myState?.channelId || myState.channelId !== state.channelId) continue;

        const channel = ChannelStore.getChannel?.(state.channelId);
        const guild = channel?.guild_id ? GuildStore.getGuild?.(channel.guild_id) : null;
        const member = guild ? GuildMemberStore.getMember?.(guild.id, state.userId) : null;
        const name = member?.nick ?? state.member?.nick ?? state.userId;
        const channelName = channel?.name ?? "voice";

        new Notification("Voice Channel", {
            body: `${name} joined #${channelName}`,
            silent: true,
        });
    }
}

export default definePlugin({
    name: "VoiceJoinNotify",
    description: "Sends a quiet desktop notification when someone joins the voice channel you're currently in.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
    },
});
