/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

// Shows the current voice channel's audio bitrate in the voice status bar.
// Reads the bitrate from the peer connection via WebRTC stats.

const STYLE_ID = "sc-voice-bitrate";
const CHIP_ID  = "sc-vb-chip";

const CSS = `
#${CHIP_ID} {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--background-modifier-accent);
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    margin-left: 6px;
    letter-spacing: .03em;
    cursor: default;
    user-select: none;
    vertical-align: middle;
}
`;

let pollInterval: ReturnType<typeof setInterval> | null = null;
let guildBitrate: number | null = null;

function onVoiceStateUpdate(data: any) {
    // When channel bitrate is available directly from Flux
    const bitrate: number | undefined =
        data?.voiceState?.bitrate
        ?? data?.channel?.bitrate
        ?? data?.bitrate;
    if (typeof bitrate === "number" && bitrate > 0) {
        guildBitrate = bitrate;
        updateChip(bitrate);
    }
}

function getWebRTCBitrate(): Promise<number | null> {
    return new Promise(resolve => {
        // Locate any active RTCPeerConnection on the window
        const pc: RTCPeerConnection | undefined = (window as any)
            .__SC_VOICE_PC ?? (window as any).__VC_VOICE_PC;
        if (!pc) return resolve(null);
        pc.getStats().then(report => {
            report.forEach((stat: any) => {
                if (stat.type === "outbound-rtp" && stat.mediaType === "audio") {
                    const kbps = Math.round((stat.bytesSent ?? 0) * 8 / 1000);
                    resolve(kbps || null);
                }
            });
            resolve(null);
        }).catch(() => resolve(null));
    });
}

function updateChip(kbps: number) {
    let chip = document.getElementById(CHIP_ID);
    if (!chip) {
        const bar = document.querySelector<HTMLElement>("[class*='voiceStatus_'], [class*='rtcConnection_']");
        if (!bar) return;
        chip = document.createElement("span");
        chip.id = CHIP_ID;
        chip.title = "Voice channel bitrate (VoiceBitrate plugin)";
        bar.appendChild(chip);
    }
    chip.textContent = `${kbps} kbps`;
}

function removeChip() {
    document.getElementById(CHIP_ID)?.remove();
}

async function pollBitrate() {
    if (guildBitrate) { updateChip(guildBitrate); return; }
    const kbps = await getWebRTCBitrate();
    if (kbps) updateChip(kbps);
}

export default definePlugin({
    name: "VoiceBitrate",
    description: "Displays the current voice channel's audio bitrate in the voice status bar as a small chip (e.g. '64 kbps').",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);

        FluxDispatcher.subscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
        FluxDispatcher.subscribe("RTC_CONNECTION_STATE", onVoiceStateUpdate);
        pollInterval = setInterval(pollBitrate, 3000);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
        removeChip();
        FluxDispatcher.unsubscribe("VOICE_STATE_UPDATES", onVoiceStateUpdate);
        FluxDispatcher.unsubscribe("RTC_CONNECTION_STATE", onVoiceStateUpdate);
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        guildBitrate = null;
    },
});
