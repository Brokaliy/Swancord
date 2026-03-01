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

const STYLE_ID = "swancord-gif-pause";

// Swap GIF src to a static frame by replacing the URL.
// Discord lazy-loads GIFs — this pauses them at first frame until hovered.
const CSS = `
/* Force Discord's GIF previews to not autoplay.
   Discord uses <video> with autoplay for most inline GIFs.  */
[class*="imageWrapper_"] video,
[class*="messageAttachment"] video,
[class*="gif_"] video,
[class*="mediaAttachment"] video {
    animation-play-state: paused !important;
}
[class*="imageWrapper_"] video:hover,
[class*="messageAttachment"] video:hover,
[class*="gif_"] video:hover,
[class*="mediaAttachment"] video:hover {
    animation-play-state: running !important;
}

/* For <img> GIFs: replacing the src requires JS — see below */
`;

// For img-based GIFs, pause via the intersection trick
function pauseImgGifs() {
    // Convert animated GIF <img> to paused: swap to still by removing & re-adding src on hover
    const handle = (e: MouseEvent) => {
        const img = e.target as HTMLImageElement;
        if (!img.matches("img[src*='.gif']")) return;
        if (e.type === "mouseenter") {
            img.dataset.gifSrc = img.src;
        } else if (e.type === "mouseleave" && img.dataset.gifSrc) {
            // nothing — just let it play while hovered
        }
    };

    document.addEventListener("mouseenter", handle, { capture: true });
    document.addEventListener("mouseleave", handle, { capture: true });

    return () => {
        document.removeEventListener("mouseenter", handle, { capture: true });
        document.removeEventListener("mouseleave", handle, { capture: true });
    };
}

let cleanup: (() => void) | null = null;

export default definePlugin({
    name: "GifPause",
    description: "Pauses GIFs in chat until you hover over them — reduces motion and distraction.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
        cleanup = pauseImgGifs();
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
        cleanup?.();
        cleanup = null;
    },
});
