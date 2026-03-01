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

// Click any unrevealed spoiler to reveal all spoilers in the channel.
// Alt+click reveals all without needing to find a specific one.

function revealAll() {
    // Discord marks hidden spoilers with a data attribute once revealed.
    // Clicking the hidden spoiler element triggers Discord's own reveal logic.
    document.querySelectorAll<HTMLElement>(
        "[class*='spoilerContent_']:not([class*='spoilerRevealed_'])"
    ).forEach(el => el.click());
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "S") {
        e.preventDefault();
        revealAll();
    }
}

function onClick(e: MouseEvent) {
    if (!e.altKey) return;
    const target = e.target as HTMLElement;
    if (target.closest("[class*='spoilerContent_']")) {
        e.preventDefault();
        e.stopPropagation();
        revealAll();
    }
}

export default definePlugin({
    name: "SpoilerReveal",
    description: "Alt+Shift+S or Alt+click any spoiler to reveal ALL spoilers in the current chat at once.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKey);
        document.addEventListener("click", onClick, { capture: true });
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("click", onClick, { capture: true });
    },
});
