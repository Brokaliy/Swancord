/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, FluxDispatcher, NavigationRouter, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Auto-navigate to the linked text channel when you join a voice channel",
        default: true,
    },
    onlyOwn: {
        type: OptionType.BOOLEAN,
        description: "Only switch when YOU join (not on every voice state update)",
        default: true,
    },
});

function onVoiceStateUpdate(event: any) {
    if (!settings.store.enabled) return;
    const states: any[] = event?.voiceStates ?? [];
    const me = UserStore.getCurrentUser?.();

    for (const state of states) {
        if (settings.store.onlyOwn && state.userId !== me?.id) continue;
        const channelId: string | null = state.channelId;
        if (!channelId) continue; // left VC

        const channel = ChannelStore.getChannel(channelId);
        if (!channel) continue;
        // linked_channel_id is the text channel linked to a VC in newer discord
        const linkedId: string | undefined = (channel as any).linkedChannelId ?? (channel as any).linked_channel_id;
        if (!linkedId) continue;

        const linked = ChannelStore.getChannel(linkedId);
        if (!linked) continue;

        NavigationRouter.transitionToGuild(linked.guild_id, linked.id);
        break;
    }
}

export default definePlugin({
    name: "VoiceTextSync",
    description: "Automatically navigates to the linked text channel when you join a voice channel.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
    },

    stop() {
        FluxDispatcher.unsubscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
    },
});
