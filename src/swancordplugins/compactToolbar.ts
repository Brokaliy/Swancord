/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-compact-toolbar";

const settings = definePluginSettings({
    iconSize: {
        type: OptionType.NUMBER,
        description: "Chat toolbar icon size in pixels (default: 20, compact: 16)",
        default: 16,
    },
});

export default definePlugin({
    name: "CompactToolbar",
    description: "Reduces the size of icons in the chat input toolbar for a more compact look.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        const sz = settings.store.iconSize || 16;
        style.textContent = `
            [class*="buttons_"] button svg,
            [class*="attachWrapper_"] button svg,
            [class*="toolbar_"] svg {
                width: ${sz}px !important;
                height: ${sz}px !important;
            }
            [class*="buttons_"] button,
            [class*="attachWrapper_"] button {
                padding: 4px !important;
            }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
