/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Press Alt+End (or Alt+B) to jump to the bottom of the current chat.
function scrollBottom() {
    const scroller = document.querySelector<HTMLElement>(
        '[class*="scroller_"][class*="chat"], [class*="scrollerInner_"], [data-list-id="chat-messages"]'
    );
    if (!scroller) return;
    scroller.scrollTop = scroller.scrollHeight;

    // Also click "jump to present" button if visible
    const jumpBtn = document.querySelector<HTMLButtonElement>('[class*="jumpToPresentBar_"] button, [class*="newMessagesBar_"] button');
    jumpBtn?.click();
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && (e.key === "End" || e.key === "b")) {
        e.preventDefault();
        scrollBottom();
    }
}

export default definePlugin({
    name: "ScrollToBottom",
    description: "Press Alt+End or Alt+B to instantly jump to the bottom of the current chat.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
    },
});
