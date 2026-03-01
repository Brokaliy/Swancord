/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";

// Alt+Shift+E — exports visible chat messages to clipboard as plain text

function exportChat() {
    const messageEls = document.querySelectorAll<HTMLElement>('[class*="messageContent_"], [class*="markup_"]');
    if (!messageEls.length) {
        Toasts.show({ message: "No messages found in view.", type: Toasts.Type.FAILURE, id: Toasts.genId() });
        return;
    }

    const lines: string[] = [];
    messageEls.forEach(el => {
        const text = el.textContent?.trim();
        if (text) lines.push(text);
    });

    navigator.clipboard.writeText(lines.join("\n")).then(() => {
        Toasts.show({
            message: `Exported ${lines.length} messages to clipboard!`,
            type: Toasts.Type.SUCCESS,
            id: Toasts.genId(),
            options: { duration: 3000 },
        });
    });
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        exportChat();
    }
}

export default definePlugin({
    name: "ChatExport",
    description: "Press Alt+Shift+E to export all visible chat messages in the current view to clipboard as plain text.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
    },
});
