/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const COUNTER_ID = "swancord-word-count";
const STYLE_ID = "swancord-word-count-style";

let counter: HTMLElement | null = null;
let observer: MutationObserver | null = null;

function getInputEl(): Element | null {
    return document.querySelector('[class*="slateTextArea_"], div[class*="textArea"][role="textbox"]');
}

function updateCount() {
    const el = getInputEl();
    if (!counter) return;
    if (!el) { counter.textContent = ""; return; }
    const text = el.textContent ?? "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    counter.textContent = chars > 0 ? `${words}w · ${chars}/2000` : "";
    counter.style.color = chars > 1900 ? "#f87171" : chars > 1600 ? "#fbbf24" : "rgba(255,255,255,0.30)";
}

export default definePlugin({
    name: "MessageWordCount",
    description: "Shows a live word and character count below the message input while you type.",
    authors: [Devs._7n7],

    start() {
        // Style
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${COUNTER_ID} {
                position: fixed;
                bottom: 12px;
                right: 16px;
                font-size: 11px;
                pointer-events: none;
                z-index: 9999;
                font-family: var(--font-code);
                transition: color 0.2s;
            }
        `;
        document.head.appendChild(style);

        counter = document.createElement("span");
        counter.id = COUNTER_ID;
        document.body.appendChild(counter);

        observer = new MutationObserver(updateCount);
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        updateCount();
    },

    stop() {
        observer?.disconnect();
        observer = null;
        counter?.remove();
        counter = null;
        document.getElementById(STYLE_ID)?.remove();
    },
});
