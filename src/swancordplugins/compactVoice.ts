/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-compact-voice";

const settings = definePluginSettings({
    hideText: {
        type: OptionType.BOOLEAN,
        description: "Hide the channel name text in the voice status bar (icon-only)",
        default: false,
    },
    hideButtons: {
        type: OptionType.BOOLEAN,
        description: "Hide mute/deafen/video/disconnect action buttons from the bar",
        default: false,
    },
});

function buildCSS(hideText: boolean, hideButtons: boolean): string {
    return `
/* Compact voice connection bar */
[class*="voiceBarContainer_"],
[class*="wrapper_"][class*="voice_"] {
    min-height: unset !important;
    padding: 4px 10px !important;
}
[class*="voiceDetailsSection_"] [class*="subText_"] {
    font-size: 10px !important;
    line-height: 1.2 !important;
}
${hideText ? `[class*="voiceDetailsSection_"] [class*="voiceChannelName_"],
[class*="voiceDetailsSection_"] [class*="title_"] { display:none !important; }` : ""}
${hideButtons ? `[class*="voiceActions_"] { display:none !important; }` : ""}
    `.trim();
}

export default definePlugin({
    name: "CompactVoice",
    description: "Collapses the bottom voice status bar into a smaller pill with optional icon-only mode.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildCSS(settings.store.hideText, settings.store.hideButtons);
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
