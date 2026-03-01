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

const STYLE_ID = "swancord-focus-mode";

const FOCUS_CSS = `
nav[class*="guilds"] { display: none !important; }
div[class*="sidebar"] { display: none !important; }
div[class*="members"] { display: none !important; }
section[class*="panels"] { display: none !important; }
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
        el.textContent = FOCUS_CSS;
    } else {
        el?.remove();
    }
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "F") {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "FocusMode",
    description: "Press Alt+Shift+F to hide the guild list, channel sidebar, member list, and user panel — leaving only the chat.",
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
