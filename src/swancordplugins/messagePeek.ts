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

const PEEK_ID = "swancord-peek-tooltip";

function createTooltip() {
    const el = document.createElement("div");
    el.id = PEEK_ID;
    Object.assign(el.style, {
        position: "fixed",
        zIndex: "10000",
        maxWidth: "360px",
        padding: "10px 14px",
        background: "rgba(10,10,10,0.92)",
        border: "1px solid rgba(124,58,237,0.3)",
        borderRadius: "8px",
        color: "#e0e0e0",
        fontSize: "0.82rem",
        lineHeight: "1.45",
        pointerEvents: "none",
        display: "none",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        wordBreak: "break-word",
    });
    document.body.appendChild(el);
    return el;
}

let tooltip: HTMLDivElement | null = null;

function onMouseOver(e: MouseEvent) {
    const channel = (e.target as HTMLElement).closest<HTMLElement>(
        "[class*='channel_']:not([class*='selected']), [class*='link_']:not([class*='selected'])"
    );
    if (!channel) return;

    const label = channel.getAttribute("aria-label") ?? channel.textContent ?? "";
    if (!label.trim()) return;

    if (!tooltip) tooltip = createTooltip();

    tooltip.textContent = label.trim();
    tooltip.style.display = "block";
    positionTooltip(e);
}

function positionTooltip(e: MouseEvent) {
    if (!tooltip) return;
    const x = e.clientX + 14;
    const y = e.clientY - 4;
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    tooltip.style.left = (x + tw > window.innerWidth ? x - tw - 20 : x) + "px";
    tooltip.style.top = (y + th > window.innerHeight ? y - th : y) + "px";
}

function onMouseMove(e: MouseEvent) {
    positionTooltip(e);
}

function onMouseOut(e: MouseEvent) {
    const channel = (e.target as HTMLElement).closest("[class*='channel_'], [class*='link_']");
    if (channel && !channel.contains(e.relatedTarget as Node)) {
        if (tooltip) tooltip.style.display = "none";
    }
}

export default definePlugin({
    name: "MessagePeek",
    description: "Shows a tooltip preview of a channel's name and description when hovering over it in the sidebar.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("mouseover", onMouseOver, { capture: true });
        document.addEventListener("mousemove", onMouseMove, { capture: true });
        document.addEventListener("mouseout", onMouseOut, { capture: true });
    },

    stop() {
        document.removeEventListener("mouseover", onMouseOver, { capture: true });
        document.removeEventListener("mousemove", onMouseMove, { capture: true });
        document.removeEventListener("mouseout", onMouseOut, { capture: true });
        document.getElementById(PEEK_ID)?.remove();
        tooltip = null;
    },
});
