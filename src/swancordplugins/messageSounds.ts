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
    volume: {
        type: OptionType.NUMBER,
        description: "Click volume (0.0 to 1.0, default: 0.08)",
        default: 0.08,
    },
    frequency: {
        type: OptionType.NUMBER,
        description: "Click pitch in Hz (default: 900)",
        default: 900,
    },
});

function playClick() {
    try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = settings.store.frequency || 900;
        const vol = Math.min(1, Math.max(0, settings.store.volume ?? 0.08));
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.06);
        osc.onended = () => ctx.close();
    } catch { /* AudioContext unavailable */ }
}

function onMessage(event: any) {
    const msg = event?.message;
    if (!msg) return;
    const me = UserStore.getCurrentUser?.();
    if (msg.author?.id === me?.id) playClick();
}

export default definePlugin({
    name: "MessageSounds",
    description: "Plays a subtle click sound whenever you send a message.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
    },
});
