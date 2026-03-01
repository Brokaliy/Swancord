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
    startFreq: {
        type: OptionType.NUMBER,
        description: "Beep frequency (Hz) when PTT activates (speaking starts)",
        default: 880,
    },
    stopFreq: {
        type: OptionType.NUMBER,
        description: "Beep frequency (Hz) when PTT deactivates (speaking stops)",
        default: 660,
    },
    volume: {
        type: OptionType.NUMBER,
        description: "Volume 0–1",
        default: 0.15,
    },
    durationMs: {
        type: OptionType.NUMBER,
        description: "Beep duration in milliseconds",
        default: 80,
    },
});

let ctx: AudioContext | null = null;

function beep(freq: number) {
    try {
        if (!ctx || ctx.state === "closed") ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(settings.store.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + settings.store.durationMs / 1000);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + settings.store.durationMs / 1000);
    } catch { /* no audio context available */ }
}

function onSpeaking(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me || event?.userId !== me.id) return;
    // speakingFlags: 1 = speaking, 0 = stopped
    if (event?.speakingFlags === 1) beep(settings.store.startFreq);
    else if (event?.speakingFlags === 0) beep(settings.store.stopFreq);
}

export default definePlugin({
    name: "VoicePTTBeep",
    description: "Plays a short beep when you start or stop speaking (great for Push-to-Talk confirmation).",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("SPEAKING", onSpeaking);
    },

    stop() {
        FluxDispatcher.unsubscribe("SPEAKING", onSpeaking);
        ctx?.close().catch(() => {});
        ctx = null;
    },
});
