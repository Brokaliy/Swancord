/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// Plays a short click sound on every keystroke in the message box,
// plus a distinct thunk sound on Enter/Backspace/Delete.

const settings = definePluginSettings({
    typingVolume: {
        type: OptionType.SLIDER,
        description: "Keystroke click volume (0.0 – 0.4)",
        default: 0.06,
        markers: [0, 0.02, 0.05, 0.08, 0.1, 0.15, 0.2, 0.3, 0.4],
        stickToMarkers: false,
    },
    sendVolume: {
        type: OptionType.SLIDER,
        description: "Send whoosh volume (0.0 – 2.0)",
        default: 0.15,
        markers: [0, 0.05, 0.1, 0.2, 0.4, 0.6, 0.8, 1.0, 1.5, 2.0],
        stickToMarkers: false,
    },
    pitch: {
        type: OptionType.SLIDER,
        description: "Base click pitch in Hz",
        default: 1100,
        markers: [400, 600, 800, 1000, 1100, 1300, 1600, 2000],
        stickToMarkers: false,
    },
    pitchVariance: {
        type: OptionType.BOOLEAN,
        description: "Slightly randomise pitch each keypress for a more natural feel",
        default: true,
    },
    enterSound: {
        type: OptionType.BOOLEAN,
        description: "Play a heavier thunk sound on Enter / Backspace / Delete",
        default: true,
    },
    sendSound: {
        type: OptionType.BOOLEAN,
        description: "Play a distinct 'whoosh' tone when you send a message (Enter to send)",
        default: true,
    },
});

// ─── AudioContext pool ──────────────────────────────────────────────────────

let ctx: AudioContext | null = null;
function getCtx(): AudioContext {
    if (!ctx || ctx.state === "closed") ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
}

// ─── Sound generators ───────────────────────────────────────────────────────

function playClick(heavy = false) {
    try {
        const ac    = getCtx();
        const vol   = Math.max(0, settings.store.typingVolume ?? 0.06);
        const base  = settings.store.pitch ?? 1100;
        const vary  = settings.store.pitchVariance ? (Math.random() - 0.5) * 180 : 0;
        const freq  = heavy ? base * 0.45 : base + vary;
        const dur   = heavy ? 0.1 : 0.055;

        const osc   = ac.createOscillator();
        const gain  = ac.createGain();
        // Very fast attack / noise-like envelope for a mechanical click feel
        const noise = ac.createOscillator();
        const nGain = ac.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(freq, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ac.currentTime + dur);

        gain.gain.setValueAtTime(vol * 0.7, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);

        // Noise layer for the "click" transient
        noise.type = "sawtooth";
        noise.frequency.setValueAtTime(freq * 2.2, ac.currentTime);
        noise.frequency.exponentialRampToValueAtTime(20, ac.currentTime + dur * 0.4);
        nGain.gain.setValueAtTime(vol * 0.55, ac.currentTime);
        nGain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur * 0.35);

        osc.connect(gain);    gain.connect(ac.destination);
        noise.connect(nGain); nGain.connect(ac.destination);

        osc.start(ac.currentTime);   osc.stop(ac.currentTime + dur);
        noise.start(ac.currentTime); noise.stop(ac.currentTime + dur * 0.4);
    } catch { /* ignore */ }
}

function playSend() {
    try {
        const ac   = getCtx();
        const vol  = Math.max(0, settings.store.sendVolume ?? 0.15);
        const osc  = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(520, ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ac.currentTime + 0.08);

        gain.gain.setValueAtTime(vol, ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(ac.currentTime);
        osc.stop(ac.currentTime + 0.12);
    } catch { /* ignore */ }
}

// ─── Keyboard wiring ────────────────────────────────────────────────────────

// Track whether Enter will send vs insert newline
let lastShift = false;

function isInMessageBox(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    return !!(
        el.getAttribute("role") === "textbox" ||
        el.closest("[class*='slateTextArea_'], [class*='textArea_']")
    );
}

function onKeyDown(e: KeyboardEvent) {
    if (!isInMessageBox(e.target)) return;

    lastShift = e.shiftKey;

    const heavy = e.key === "Backspace" || e.key === "Delete";
    const isEnter = e.key === "Enter";

    if (isEnter) {
        if (!e.shiftKey && settings.store.sendSound) {
            playSend();
        } else {
            playClick(true);
        }
        return;
    }

    if (heavy && settings.store.enterSound) {
        playClick(true);
        return;
    }

    // Skip modifier-only, arrow keys, function keys
    if (e.key.length === 1 || e.key === "Tab") {
        playClick(false);
    }
}

// ─── Plugin ─────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "TypewriterSounds",
    description: "Plays a mechanical click on every keystroke in the message box. Distinct sound for Backspace/Delete and a whoosh when you send.",
    authors: [Devs._7n7],
    settings,

    start() {
        document.addEventListener("keydown", onKeyDown, true);
    },

    stop() {
        document.removeEventListener("keydown", onKeyDown, true);
        try { ctx?.close(); } catch { /* ignore */ }
        ctx = null;
    },
});
