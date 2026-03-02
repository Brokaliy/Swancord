/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// Session-only clipboard history for the message input draft.
// Saves up to N drafts as you type, and lets you cycle through
// them with a keyboard shortcut (default: Alt+Up / Alt+Down).

const HISTORY_MAX_DEFAULT = 20;
const history: string[] = [];
let historyIndex = -1; // -1 = not browsing
let lastDraft = "";
let initialized = false;

const settings = definePluginSettings({
    maxEntries: {
        type: OptionType.NUMBER,
        description: "Maximum number of drafts to keep per session",
        default: HISTORY_MAX_DEFAULT,
    },
    saveOnSend: {
        type: OptionType.BOOLEAN,
        description: "Save a draft snapshot when you press Enter to send",
        default: true,
    },
});

function pushDraft(text: string) {
    if (!text || text === lastDraft) return;
    // Avoid consecutive identical entries
    if (history[0] === text) return;
    history.unshift(text);
    const max = settings.store.maxEntries ?? HISTORY_MAX_DEFAULT;
    if (history.length > max) history.length = max;
    historyIndex = -1;
    lastDraft = text;
}

function onKeyDown(e: KeyboardEvent) {
    if (!e.altKey) return;
    const target = e.target as HTMLElement;
    // Only operate inside the message input
    if (!target.matches?.("[class*='slateTextArea_'], [class*='textArea_'] [contenteditable]")) return;

    if (e.key === "ArrowUp") {
        e.preventDefault();
        if (!history.length) return;
        // Save current value before browsing
        if (historyIndex === -1) pushDraft(target.textContent ?? "");
        historyIndex = Math.min(historyIndex + 1, history.length - 1);
        setInputValue(target, history[historyIndex]);
    } else if (e.key === "ArrowDown") {
        if (historyIndex <= 0) { historyIndex = -1; setInputValue(target, ""); return; }
        e.preventDefault();
        historyIndex--;
        setInputValue(target, history[historyIndex]);
    }
}

function setInputValue(el: HTMLElement, text: string) {
    // React-controlled contenteditable: dispatch a native input event
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "textContent")?.set;
    nativeInputValueSetter?.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
}

function onKeyUp(e: KeyboardEvent) {
    if (!settings.store.saveOnSend) return;
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (!target.matches?.("[class*='slateTextArea_'], [class*='textArea_'] [contenteditable]")) return;
    // Message was just sent; save the previous draft (it's already gone from DOM, but lastDraft holds it)
    pushDraft(lastDraft);
}

function onInput(e: Event) {
    const target = e.target as HTMLElement;
    if (!target.matches?.("[class*='slateTextArea_'], [class*='textArea_'] [contenteditable]")) return;
    const text = target.textContent ?? "";
    lastDraft = text;
    historyIndex = -1;
}

export default definePlugin({
    name: "ClipboardHistory",
    description: "Keeps a session history of your last 20 message drafts. Cycle through them with Alt+Up / Alt+Down in the message box.",
    authors: [Devs._7n7],
    settings,

    start() {
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("keyup", onKeyUp, true);
        document.addEventListener("input", onInput, true);
        initialized = true;
    },

    stop() {
        document.removeEventListener("keydown", onKeyDown, true);
        document.removeEventListener("keyup", onKeyUp, true);
        document.removeEventListener("input", onInput, true);
        history.length = 0;
        historyIndex = -1;
        initialized = false;
    },
});
