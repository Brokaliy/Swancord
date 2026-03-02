/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    frequency: {
        type: OptionType.NUMBER,
        description: "Sound frequency in Hz (lower = deeper, default: 880)",
        default: 880,
    },
    volume: {
        type: OptionType.NUMBER,
        description: "Sound volume 0.0–1.0 (default: 0.25)",
        default: 0.25,
    },
    duration: {
        type: OptionType.NUMBER,
        description: "Sound duration in milliseconds (default: 120)",
        default: 120,
    },
});

let audioCtx: AudioContext | null = null;

function playBeep() {
    try {
        if (!audioCtx) audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.value = Math.max(100, Math.min(4000, settings.store.frequency));
        const vol = Math.max(0, Math.min(1, settings.store.volume));
        const dur = Math.max(20, Math.min(1000, settings.store.duration)) / 1000;
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + dur);
    } catch {
        // AudioContext not available
    }
}

function onSpoilerClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest("[class*='spoilerText_'], [class*='hiddenSpoilers_'], [class*='spoiler_']")) return;
    playBeep();
}

export default definePlugin({
    name: "SpoilerAlert",
    description: "Plays a subtle beep sound when you click to reveal a spoiler tag.",
    authors: [Devs._7n7],
    settings,

    start() {
        document.addEventListener("click", onSpoilerClick, true);
    },

    stop() {
        document.removeEventListener("click", onSpoilerClick, true);
        audioCtx?.close();
        audioCtx = null;
    },
});
