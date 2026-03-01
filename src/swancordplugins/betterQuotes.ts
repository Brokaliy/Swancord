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

const STYLE_ID = "swancord-better-quotes";

// Makes blockquotes (> quoted text) look nicer in chat
const CSS = `
[class*="blockquote_"],
[class*="blockquoteContainer"],
blockquote {
    border-left: 3px solid #7c3aed !important;
    background: rgba(124,58,237,0.07) !important;
    border-radius: 0 6px 6px 0 !important;
    padding: 6px 12px !important;
    margin: 4px 0 !important;
    color: var(--text-normal, #e0e0e0) !important;
}

/* Quote divider bar styling */
[class*="blockquoteDivider_"] {
    background: #7c3aed !important;
    width: 3px !important;
    border-radius: 2px !important;
}

/* Nested quotes */
[class*="blockquote_"] [class*="blockquote_"] {
    border-left-color: rgba(124,58,237,0.5) !important;
    background: rgba(124,58,237,0.04) !important;
}
`;

export default definePlugin({
    name: "BetterQuotes",
    description: "Styles blockquotes in chat with purple left-border and subtle background for better readability.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
