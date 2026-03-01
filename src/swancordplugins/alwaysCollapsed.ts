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

const STYLE_ID = "swancord-always-collapsed";

// Hide the member list and threads sidebar by default to give chat more space.
// Press Ctrl+Alt+M to toggle the member list back.
const CSS = `
[class*="members_"],
[class*="membersWrap_"] {
    display: none !important;
}
`;

let visible = false;
let styleEl: HTMLStyleElement | null = null;

function toggle() {
    visible = !visible;
    if (!styleEl) return;
    styleEl.textContent = visible ? "" : CSS;
}

function onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.altKey && e.key === "M") {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "HideMemberList",
    description: "Hides the member list sidebar by default to maximise chat space. Press Ctrl+Alt+M to toggle it back.",
    authors: [Devs._7n7],

    start() {
        styleEl = document.createElement("style");
        styleEl.id = STYLE_ID;
        styleEl.textContent = CSS;
        document.head.appendChild(styleEl);
        visible = false;
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        styleEl?.remove();
        styleEl = null;
        visible = false;
    },
});
