/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const COUNTER_ID = "swancord-msg-counter";
const STYLE_ID = "swancord-msg-len";
const MAX = 2000;

function getOrCreate(): HTMLSpanElement {
    let el = document.getElementById(COUNTER_ID) as HTMLSpanElement | null;
    if (el) return el;
    el = document.createElement("span");
    el.id = COUNTER_ID;
    return el;
}

function updateCounter(text: string) {
    const el = getOrCreate();
    const len = text.length;
    el.textContent = `${len}/${MAX}`;
    el.style.color = len > MAX * 0.9 ? (len >= MAX ? "#f87171" : "#fbbf24") : "rgba(255,255,255,0.35)";

    const bar = document.querySelector<HTMLElement>("[class*='channelTextArea'] [class*='buttons_']");
    if (bar && !bar.contains(el)) {
        bar.insertBefore(el, bar.firstChild);
    }
}

let observer: MutationObserver | null = null;

function watchTextarea() {
    const ta = document.querySelector<HTMLElement>("[class*='slateTextArea'], [role='textbox'][class*='editor']");
    if (!ta || ta.dataset.scLenWatched) return;
    ta.dataset.scLenWatched = "1";

    const handler = () => updateCounter(ta.textContent ?? "");
    ta.addEventListener("input", handler);
    handler();
}

export default definePlugin({
    name: "MessageLength",
    description: "Shows a character counter (X/2000) next to the message input buttons while typing.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${COUNTER_ID} {
                font-size: 0.72rem;
                font-weight: 600;
                padding: 0 6px;
                align-self: center;
                user-select: none;
                pointer-events: none;
                transition: color 0.2s;
            }
        `;
        document.head.appendChild(style);

        watchTextarea();
        observer = new MutationObserver(watchTextarea);
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        observer?.disconnect(); observer = null;
        document.getElementById(COUNTER_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
        document.querySelectorAll("[data-sc-len-watched]").forEach(el => {
            delete (el as HTMLElement).dataset.scLenWatched;
        });
    },
});
