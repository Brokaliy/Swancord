/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// Patches the Web Audio API to mute all Discord sounds.
// Separate from the notification sound toggle — kills everything
// (incoming call ringtone, button clicks, message pings, etc.)

const STYLE_ID = "sc-mute-all-sounds";
const BTN_ID   = "sc-mute-btn";

let muted = false;
let gainNodes: GainNode[] = [];
const originalCreate = AudioContext.prototype.createGain;

function patchAudio(mute: boolean) {
    // Walk all AudioContexts known to us and set gain to 0 / 1
    gainNodes.forEach(g => {
        try { g.gain.value = mute ? 0 : 1; } catch { /* stale node */ }
    });
    muted = mute;
    const btn = document.getElementById(BTN_ID);
    if (btn) btn.title = mute ? "Unmute all sounds (MuteAllSounds)" : "Mute all sounds (MuteAllSounds)";
}

function interceptGainCreate(this: AudioContext): GainNode {
    const node = originalCreate.call(this) as GainNode;
    gainNodes.push(node);
    if (muted) node.gain.value = 0;
    return node;
}

const settings = definePluginSettings({
    startMuted: {
        type: OptionType.BOOLEAN,
        description: "Start with all sounds muted when Discord launches",
        default: false,
    },
    showButton: {
        type: OptionType.BOOLEAN,
        description: "Show a quick-toggle mute button in the lower-left toolbar area",
        default: true,
    },
});

function injectButton() {
    if (!settings.store.showButton) return;
    if (document.getElementById(BTN_ID)) return;
    const toolbar = document.querySelector<HTMLElement>("[class*='panels_'], [class*='container_'][class*='avatarWrapper_']");
    if (!toolbar) return;
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.textContent = "🔇";
    btn.title = "Mute all sounds (MuteAllSounds)";
    btn.style.cssText = "background:none;border:none;cursor:pointer;font-size:18px;padding:4px 6px;border-radius:4px;transition:opacity .15s;opacity:.7;";
    btn.addEventListener("mouseenter", () => btn.style.opacity = "1");
    btn.addEventListener("mouseleave", () => btn.style.opacity = ".7");
    btn.addEventListener("click", () => {
        patchAudio(!muted);
        btn.textContent = muted ? "🔇" : "🔊";
    });
    toolbar.prepend(btn);
}

let btnInterval: ReturnType<typeof setInterval> | null = null;

export default definePlugin({
    name: "MuteAllSounds",
    description: "One-click button (🔇) to silence every Discord sound — ringtones, pings, UI clicks — via Web Audio API gain interception.",
    authors: [Devs._7n7],
    settings,

    start() {
        // Monkey-patch AudioContext.prototype.createGain so we capture all nodes
        AudioContext.prototype.createGain = interceptGainCreate;

        if (settings.store.startMuted) patchAudio(true);

        btnInterval = setInterval(injectButton, 2000);
        setTimeout(injectButton, 800);
    },

    stop() {
        AudioContext.prototype.createGain = originalCreate;
        patchAudio(false);
        gainNodes = [];
        document.getElementById(BTN_ID)?.remove();
        if (btnInterval) { clearInterval(btnInterval); btnInterval = null; }
    },
});
