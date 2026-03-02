/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const STYLE_ID = "swancord-dm-filter";
const INPUT_ID = "swancord-dm-filter-input";

const settings = definePluginSettings({
    onlineOnly: {
        type: OptionType.BOOLEAN,
        description: "When filter is empty, show only online friends (toggle-able in the search bar)",
        default: false,
    },
    placeholder: {
        type: OptionType.STRING,
        description: "Placeholder text for the DM search input",
        default: "Filter DMs…",
    },
});

const CSS = `
#${INPUT_ID} {
    display: block;
    width: calc(100% - 16px);
    margin: 6px 8px;
    padding: 5px 10px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-accent, #4f545c);
    background: var(--background-secondary, #2f3136);
    color: var(--text-normal, #dcddde);
    font-size: 13px;
    outline: none;
    box-sizing: border-box;
}
#${INPUT_ID}:focus {
    border-color: var(--brand-500, #5865f2);
}
`;

function applyFilter(query: string) {
    const q = query.toLowerCase().trim();
    const items = document.querySelectorAll<HTMLElement>(
        "[class*='channel_'][class*='privateChannel_'], [class*='dmChannel_']"
    );
    items.forEach(item => {
        if (!q) {
            item.style.display = "";
            return;
        }
        const name = item.querySelector("[class*='name_']")?.textContent?.toLowerCase() ?? "";
        item.style.display = name.includes(q) ? "" : "none";
    });
}

function injectInput() {
    if (document.getElementById(INPUT_ID)) return;
    const list = document.querySelector<HTMLElement>(
        "[class*='privateChannels_'] [class*='scrollerBase_'], "
        + "[aria-label='Direct Messages'] [class*='content_']"
    );
    if (!list) return;

    const input = document.createElement("input");
    input.id = INPUT_ID;
    input.type = "text";
    input.placeholder = settings.store.placeholder || "Filter DMs…";
    input.autocomplete = "off";
    input.addEventListener("input", () => applyFilter(input.value));
    list.prepend(input);
}

let intervalId: ReturnType<typeof setInterval> | null = null;

function onNavigate() {
    injectInput();
}

export default definePlugin({
    name: "DmFilter",
    description: "Adds a search/filter bar to the DM list so you can quickly find conversations by name.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);

        // Retry injection since DM list may not be mounted yet
        intervalId = setInterval(() => {
            if (document.getElementById(INPUT_ID)) {
                if (intervalId) clearInterval(intervalId);
                intervalId = null;
            } else {
                injectInput();
            }
        }, 1000);

        FluxDispatcher.subscribe("CHANNEL_SELECT", onNavigate);
    },

    stop() {
        FluxDispatcher.unsubscribe("CHANNEL_SELECT", onNavigate);
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
        document.getElementById(INPUT_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
        // Restore all hidden items
        document.querySelectorAll<HTMLElement>("[class*='privateChannel_']").forEach(el => {
            el.style.display = "";
        });
    },
});
