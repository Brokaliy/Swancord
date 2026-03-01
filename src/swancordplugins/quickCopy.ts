/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";

function onMouseDown(e: MouseEvent) {
    if (!e.altKey) return;
    const target = e.target as Element;
    // Walk up to find message content
    const content = target.closest('[class*="messageContent_"], [class*="markup_"]');
    if (!content) return;
    e.preventDefault();
    e.stopPropagation();
    const text = content.textContent ?? "";
    navigator.clipboard.writeText(text).then(() => {
        Toasts.show({
            message: "Message copied!",
            type: Toasts.Type.SUCCESS,
            id: Toasts.genId(),
            options: { duration: 1500 },
        });
    });
}

export default definePlugin({
    name: "QuickCopy",
    description: "Alt+click any message to instantly copy its text content to clipboard.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("mousedown", onMouseDown, true);
    },

    stop() {
        document.removeEventListener("mousedown", onMouseDown, true);
    },
});
