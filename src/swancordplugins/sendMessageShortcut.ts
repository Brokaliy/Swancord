/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    shiftEnterSends: {
        type: OptionType.BOOLEAN,
        description: "If enabled, Shift+Enter sends messages and Enter creates a new line (swaps default behavior).",
        default: false,
    },
});

function onKeyDown(e: KeyboardEvent) {
    if (!settings.store.shiftEnterSends) return;

    const ta = (e.target as HTMLElement);
    if (!ta.matches("[role='textbox'], [class*='slateTextArea']")) return;

    if (e.key === "Enter" && !e.shiftKey) {
        // Enter alone: insert newline via browser default (do nothing — textbox handles it)
        // We override so Enter doesn't send
        e.stopImmediatePropagation();
    }
    // Shift+Enter: let it propagate — Discord uses this to send when configured
}

export default definePlugin({
    name: "SendMessageShortcut",
    description: "Optionally swaps Enter / Shift+Enter behavior: with the option on, Shift+Enter sends and Enter creates a new line.",
    authors: [Devs._7n7],
    settings,

    start() {
        document.addEventListener("keydown", onKeyDown, { capture: true });
    },

    stop() {
        document.removeEventListener("keydown", onKeyDown, { capture: true });
    },
});
