/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const COUNTER_ID = "swancord-msg-counter";
const STYLE_ID   = "swancord-msg-len";
const MAX        = 2000;

function getOrCreate(): HTMLSpanElement {
    let el = document.getElementById(COUNTER_ID) as HTMLSpanElement | null;
    if (el) return el;
    el = document.createElement("span");
    el.id = COUNTER_ID;
    return el;
}

function updateCounter(len: number) {
    const el = getOrCreate();
    el.textContent = `${len}/${MAX}`;

    if (len >= MAX) {
        el.dataset.state = "over";
    } else if (len >= MAX * 0.9) {
        el.dataset.state = "warn";
    } else {
        el.dataset.state = "ok";
    }

    // Insert into the message box button row if not already there
    const bar = document.querySelector<HTMLElement>(
        "[class*='channelTextArea_'] [class*='buttons_'], [class*='textAreaButtons_']"
    );
    if (bar && !bar.contains(el)) {
        bar.insertBefore(el, bar.firstChild);
    }

    el.style.display = len === 0 ? "none" : "";
}

function onDraftSave(event: any) {
    // type 0 = regular channel message draft
    if (event.type !== 0) return;
    updateCounter((event.content ?? "").length);
}

export default definePlugin({
    name: "MessageLength",
    description: "Shows a live character counter (X/2000) next to the message input buttons while typing.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            #${COUNTER_ID} {
                font-size: 0.72rem;
                font-weight: 600;
                font-variant-numeric: tabular-nums;
                padding: 0 6px;
                align-self: center;
                user-select: none;
                pointer-events: none;
                transition: color 0.15s;
                display: none;
            }
            #${COUNTER_ID}[data-state="ok"]   { color: rgba(255,255,255,0.35); }
            #${COUNTER_ID}[data-state="warn"]  { color: #fbbf24; }
            #${COUNTER_ID}[data-state="over"]  { color: #f87171; }
        `;
        document.head.appendChild(style);
        FluxDispatcher.subscribe("DRAFT_SAVE", onDraftSave);
    },

    stop() {
        FluxDispatcher.unsubscribe("DRAFT_SAVE", onDraftSave);
        document.getElementById(COUNTER_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
    },
});
