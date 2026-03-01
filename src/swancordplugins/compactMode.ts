/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-compact-mode";

// Compact layout — reduces message padding and shrinks avatars
const COMPACT_CSS = `
[class*="cozyMessage_"],
[class*="groupStart_"] {
    margin-top: 2px !important;
    padding-top: 2px !important;
    padding-bottom: 2px !important;
}

[class*="cozyMessage_"] [class*="avatar_"],
[class*="groupStart_"] [class*="avatar_"] {
    width: 30px !important;
    height: 30px !important;
    margin-top: 1px !important;
}

[class*="message_"][class*="cozy"] {
    min-height: 0 !important;
}

[class*="messageContent_"] {
    font-size: 0.92rem !important;
    line-height: 1.35 !important;
}

[class*="timestamp_"] {
    font-size: 0.68rem !important;
}

[class*="username_"] {
    font-size: 0.9rem !important;
}
`;

let active = false;

function toggle() {
    active = !active;
    let el = document.getElementById(STYLE_ID);
    if (active) {
        if (!el) {
            el = document.createElement("style");
            el.id = STYLE_ID;
            document.head.appendChild(el);
        }
        el.textContent = COMPACT_CSS;
    } else {
        el?.remove();
    }
}

function onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.altKey && e.key === "C") {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "CompactMode",
    description: "Press Ctrl+Alt+C to toggle compact message layout — smaller avatars, tighter spacing.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        document.getElementById(STYLE_ID)?.remove();
        active = false;
    },
});
