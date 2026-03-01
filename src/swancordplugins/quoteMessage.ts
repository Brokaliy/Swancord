/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const MessageActions = findByPropsLazy("sendMessage", "editMessage");
const SelectedChannelStore = findByPropsLazy("getChannelId");
const ComponentDispatch = findByPropsLazy("dispatchToLastSubscribed", "ComponentDispatch");

function onKeyDown(e: KeyboardEvent) {
    if (!e.ctrlKey || e.code !== "KeyQ") return;

    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) return;

    e.preventDefault();

    // Build a blockquote-style quoted text
    const quoted = text.split("\n").map(line => `> ${line}`).join("\n");

    // Focus the message input and insert the quoted text
    try {
        ComponentDispatch?.dispatchToLastSubscribed?.("INSERT_TEXT", {
            rawText: quoted + "\n",
            plainText: quoted + "\n",
        });
    } catch (_) {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(quoted + "\n");
    }

    // Clear the selection
    sel?.removeAllRanges();
}

export default definePlugin({
    name: "QuoteMessage",
    description: "Select any text in a message and press Ctrl+Q to insert it as a blockquote (> text) in the reply input.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKeyDown);
    },

    stop() {
        document.removeEventListener("keydown", onKeyDown);
    },
});
