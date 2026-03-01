/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-reading-mode";

const READING_CSS = `
    [class*="chat_"],
    [class*="chatContent_"] { max-width: 860px !important; margin: 0 auto !important; }
    [class*="markup_"],
    [class*="messageContent_"] {
        font-size: 16px !important;
        line-height: 1.7 !important;
        letter-spacing: 0.01em !important;
    }
    [class*="members_"],
    [class*="membersWrap_"] { display: none !important; }
`;

let active = false;

function toggle() {
    active = !active;
    let style = document.getElementById(STYLE_ID);
    if (active) {
        if (!style) {
            style = document.createElement("style");
            style.id = STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = READING_CSS;
    } else {
        style?.remove();
    }
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "R") {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "ReadingMode",
    description: "Press Alt+Shift+R to toggle reading mode — increases text size, line height, and hides the member list for distraction-free reading.",
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
