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

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const STEP = 0.1;

let zoom = 1;
let wheelHandler: (e: WheelEvent) => void;
let keyHandler: (e: KeyboardEvent) => void;

function applyZoom() {
    document.documentElement.style.zoom = String(Math.round(zoom * 100) / 100);
}

export default definePlugin({
    name: "DiscordZoom",
    description: "Zoom in/out with Ctrl+Scroll. Ctrl+0 resets. Great for screenshots.",
    authors: [Devs._7n7],

    start() {
        zoom = 1;

        wheelHandler = (e: WheelEvent) => {
            if (!e.ctrlKey) return;
            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY < 0 ? STEP : -STEP;
            zoom = Math.round(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta)) * 100) / 100;
            applyZoom();
        };

        keyHandler = (e: KeyboardEvent) => {
            if (!e.ctrlKey || e.key !== "0") return;
            zoom = 1;
            applyZoom();
        };

        window.addEventListener("wheel", wheelHandler, { passive: false, capture: true });
        window.addEventListener("keydown", keyHandler);
    },

    stop() {
        window.removeEventListener("wheel", wheelHandler, { capture: true });
        window.removeEventListener("keydown", keyHandler);
        document.documentElement.style.zoom = "";
    },
});
