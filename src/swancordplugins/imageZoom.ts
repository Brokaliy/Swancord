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

const STYLE_ID = "swancord-image-zoom";

const CSS = `
#sc-zoom-overlay {
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(0,0,0,0.88);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: zoom-out;
    backdrop-filter: blur(4px);
    animation: sc-fadein 0.12s ease;
}
@keyframes sc-fadein { from { opacity: 0 } to { opacity: 1 } }
#sc-zoom-overlay img {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 6px;
    box-shadow: 0 16px 64px rgba(0,0,0,0.90);
    user-select: none;
    pointer-events: none;
}
`;

function showZoom(src: string) {
    closeZoom();
    const overlay = document.createElement("div");
    overlay.id = "sc-zoom-overlay";

    const img = document.createElement("img");
    img.src = src;
    overlay.appendChild(img);

    overlay.addEventListener("click", closeZoom);
    document.addEventListener("keydown", onEsc);
    document.body.appendChild(overlay);
}

function closeZoom() {
    document.getElementById("sc-zoom-overlay")?.remove();
    document.removeEventListener("keydown", onEsc);
}

function onEsc(e: KeyboardEvent) {
    if (e.key === "Escape") closeZoom();
}

function onImgClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    // Only zoom on images inside Discord's chat message area
    const img = target.closest<HTMLImageElement>("[class*='imageWrapper_'] img, [class*='originalLink_'] img, [class*='imageContainer_'] img");
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();
    showZoom(img.src);
}

export default definePlugin({
    name: "ImageZoom",
    description: "Click on any image in chat to view it fullscreen in a clean overlay. Press Escape or click to close.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);

        document.addEventListener("click", onImgClick, { capture: true });
    },

    stop() {
        document.removeEventListener("click", onImgClick, { capture: true });
        document.getElementById(STYLE_ID)?.remove();
        closeZoom();
    },
});
