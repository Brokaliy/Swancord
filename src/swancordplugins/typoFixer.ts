/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// Built-in common typo corrections (expanded by user settings)
const BUILT_IN: Record<string, string> = {
    "teh":   "the",
    "hte":   "the",
    "adn":   "and",
    "nad":   "and",
    "ahve":  "have",
    "ahd":   "had",
    "ot":    "to",
    "fo":    "of",
    "heer":  "here",
    "taht":  "that",
    "thta":  "that",
    "woudl": "would",
    "coudl": "could",
    "shoud": "should",
    "becuas": "because",
    "becuase": "because",
    "recieve": "receive",
    "recieved": "received",
    "seperate": "separate",
    "occured":  "occurred",
    "untill":   "until",
    "dont":  "don't",
    "cant":  "can't",
    "wont":  "won't",
    "youre": "you're",
    "theyre": "they're",
    "im":    "I'm",
};

const settings = definePluginSettings({
    customEntries: {
        type: OptionType.STRING,
        description: "Extra typo:fix pairs, comma-separated (e.g. helo:hello,wrold:world)",
        default: "",
    },
    enabled: {
        type: OptionType.BOOLEAN,
        description: "Enable auto-fix while typing",
        default: true,
    },
});

function buildMap(): Map<string, string> {
    const map = new Map<string, string>(Object.entries(BUILT_IN));
    for (const pair of settings.store.customEntries.split(",")) {
        const [typo, fix] = pair.split(":").map(s => s.trim());
        if (typo && fix) map.set(typo.toLowerCase(), fix);
    }
    return map;
}

// Fix the last word when Space or Enter is pressed
function onKeyDown(e: KeyboardEvent) {
    if (!settings.store.enabled) return;
    if (e.key !== " " && e.key !== "Enter") return;

    const el = document.activeElement as HTMLElement | null;
    if (!el?.isContentEditable) return;
    if (!el.closest("[class*=\"slateTextArea_\"], [class*=\"textArea_\"]")) return;

    const text = el.textContent ?? "";
    // Get the last word before the cursor
    const wordMatch = text.trimEnd().match(/(\S+)$/);
    if (!wordMatch) return;
    const lastWord = wordMatch[1];
    const fix = buildMap().get(lastWord.toLowerCase());
    if (!fix) return;

    // Preserve capitalisation of first letter
    const corrected = lastWord[0] === lastWord[0].toUpperCase() && lastWord[0] !== lastWord[0].toLowerCase()
        ? fix[0].toUpperCase() + fix.slice(1)
        : fix;

    if (corrected === lastWord) return;

    // Replace via execCommand so undo works
    e.preventDefault();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    range.setStart(range.startContainer, range.startOffset - lastWord.length);
    sel.removeAllRanges();
    sel.addRange(range);
    document.execCommand("delete");
    document.execCommand("insertText", false, corrected + (e.key === " " ? " " : ""));
}

export default definePlugin({
    name: "TypoFixer",
    description: "Automatically corrects common typos as you type (fixes on Space/Enter). Add your own corrections in settings.",
    authors: [Devs._7n7],
    settings,

    start() { document.addEventListener("keydown", onKeyDown, true); },
    stop()  { document.removeEventListener("keydown", onKeyDown, true); },
});
