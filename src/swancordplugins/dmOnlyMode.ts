/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-dm-only-mode";

let active = false;

const DM_CSS = `
    nav[class*="guilds"],
    [class*="guilds_"],
    [class*="guildsNav_"] { display: none !important; }
`;

function toggle() {
    active = !active;
    let style = document.getElementById(STYLE_ID);
    if (active) {
        if (!style) {
            style = document.createElement("style");
            style.id = STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = DM_CSS;
    } else {
        style?.remove();
    }
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "DmOnlyMode",
    description: "Press Alt+Shift+D to toggle DM-only mode — hides the server list, leaving only the DM sidebar and chat.",
    authors: [Devs._7n7],

    start() {
        active = false;
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        document.getElementById(STYLE_ID)?.remove();
        active = false;
    },
});
