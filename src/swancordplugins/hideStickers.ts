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

const STYLE_ID = "swancord-hide-stickers";

// Hides the sticker button from the message bar and sticker suggestions.
// Stickers sent by others are still rendered.
const CSS = `
/* Sticker button in message input bar */
[class*="buttonContainer_"] [aria-label*="ticker"],
[class*="stickerButton"],
[class*="pickStickerButton"] {
    display: none !important;
}

/* Sticker suggestions that pop up while typing */
[class*="stickerAutoComplete"],
[class*="stickerSuggestion"] {
    display: none !important;
}

/* "Get Stickers" upsell in sticker picker */
[class*="storeTab"],
[class*="stickerNitroUpsell"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "HideStickers",
    description: "Removes the sticker button from the message bar and hides sticker upsells. Stickers in existing messages still display normally.",
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
