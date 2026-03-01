/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    words: {
        type: OptionType.STRING,
        description: "Comma-separated list of words to censor in chat (case-insensitive)",
        default: "",
    },
    replacement: {
        type: OptionType.STRING,
        description: "Replacement string for censored words (default: ***)",
        default: "***",
    },
});

let observer: MutationObserver | null = null;

function getWordList(): string[] {
    return settings.store.words
        .split(",")
        .map(w => w.trim())
        .filter(Boolean);
}

function censorNode(node: Node) {
    if (node.nodeType !== Node.TEXT_NODE) return;
    const words = getWordList();
    if (!words.length) return;
    const replacement = settings.store.replacement || "***";
    const pattern = new RegExp(`\\b(${words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");
    const orig = node.textContent ?? "";
    const censored = orig.replace(pattern, replacement);
    if (censored !== orig) node.textContent = censored;
}

function censorAll() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) censorNode(node);
}

export default definePlugin({
    name: "SwearFilter",
    description: "Client-side word censor — replaces configured words in chat with ***. Words are comma-separated in settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        censorAll();
        observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                m.addedNodes.forEach(n => {
                    if (n.nodeType === Node.TEXT_NODE) censorNode(n);
                    else if (n.nodeType === Node.ELEMENT_NODE) {
                        const walker = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
                        let t: Node | null;
                        while ((t = walker.nextNode())) censorNode(t);
                    }
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        observer?.disconnect();
        observer = null;
    },
});
