/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-custom-cursor";

const settings = definePluginSettings({
    cursor: {
        type: OptionType.SELECT,
        description: "Cursor style to apply across Discord",
        options: [
            { label: "Default", value: "default", default: true },
            { label: "Crosshair", value: "crosshair" },
            { label: "None (invisible)", value: "none" },
            { label: "Wait (loading)", value: "wait" },
            { label: "Cell (crosshair+)", value: "cell" },
            { label: "Zoom In", value: "zoom-in" },
        ],
    },
});

export default definePlugin({
    name: "CustomCursor",
    description: "Change the mouse cursor style across Discord.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `*, *::before, *::after { cursor: ${settings.store.cursor} !important; }`;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
