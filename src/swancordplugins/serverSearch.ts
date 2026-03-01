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

const STYLE_ID = "swancord-server-search";

const CSS = `
#sc-server-search-wrap {
    position: fixed;
    bottom: 72px;
    left: 0;
    width: 72px;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 200;
    pointer-events: none;
}
#sc-server-search-input {
    width: 44px;
    padding: 5px 6px;
    font-size: 0.72rem;
    background: rgba(20,20,20,0.96);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    color: #e0e0e0;
    outline: none;
    text-align: center;
    pointer-events: all;
    transition: width 0.15s;
    box-shadow: 0 4px 16px rgba(0,0,0,0.6);
}
#sc-server-search-input:focus {
    width: 120px;
    border-color: rgba(124,58,237,0.55);
}
`;

let wrap: HTMLDivElement | null = null;
let input: HTMLInputElement | null = null;
let styleEl: HTMLStyleElement | null = null;
let observer: MutationObserver | null = null;

function filterGuilds(query: string) {
    // Guild icons are inside the guild scroller; each has a tooltip/aria-label with the server name.
    const items = document.querySelectorAll<HTMLElement>(
        "nav[class*='guilds_'] [class*='listItem_'], nav[class*='guildsNav_'] [class*='listItem_']"
    );
    const q = query.trim().toLowerCase();
    items.forEach(item => {
        if (!q) {
            (item as HTMLElement).style.display = "";
            return;
        }
        const label = item.querySelector("[aria-label]")?.getAttribute("aria-label")?.toLowerCase() ?? "";
        const visible = label.includes(q);
        (item as HTMLElement).style.display = visible ? "" : "none";
    });
}

function onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.altKey && e.key === "F") {
        e.preventDefault();
        input?.focus();
        input?.select();
    }
    if (e.key === "Escape" && document.activeElement === input) {
        if (input) {
            input.value = "";
            filterGuilds("");
            input.blur();
        }
    }
}

export default definePlugin({
    name: "ServerSearch",
    description: "Press Ctrl+Alt+F to quickly filter your server list by name. Escape clears the filter.",
    authors: [Devs._7n7],

    start() {
        styleEl = document.createElement("style");
        styleEl.id = STYLE_ID;
        styleEl.textContent = CSS;
        document.head.appendChild(styleEl);

        wrap = document.createElement("div");
        wrap.id = "sc-server-search-wrap";

        input = document.createElement("input");
        input.id = "sc-server-search-input";
        input.type = "text";
        input.placeholder = "srch";
        input.title = "Filter servers (Ctrl+Alt+F)";
        input.addEventListener("input", () => filterGuilds(input!.value));
        wrap.appendChild(input);
        document.body.appendChild(wrap);

        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        observer?.disconnect();
        wrap?.remove();
        styleEl?.remove();
        filterGuilds(""); // restore all guilds
        wrap = null;
        input = null;
        styleEl = null;
    },
});
