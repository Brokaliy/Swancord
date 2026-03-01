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

const STYLE_ID = "swancord-timestamp-toggle";
let hidden = false;

function apply() {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (hidden) {
        if (!style) {
            style = document.createElement("style");
            style.id = STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = `
            [class*="timestamp_"],
            [class*="time_"][class*="message"],
            [class*="messageTimestamp"] {
                display: none !important;
            }
        `;
    } else {
        style?.remove();
    }
}

function onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.altKey && e.code === "KeyT") {
        hidden = !hidden;
        apply();
    }
}

export default definePlugin({
    name: "TimestampToggle",
    description: "Press Ctrl+Alt+T to show/hide message timestamps in chat.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        document.getElementById(STYLE_ID)?.remove();
        hidden = false;
    },
});
