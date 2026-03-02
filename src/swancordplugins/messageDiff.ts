/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// Shows a diff overlay when you hover the "(edited)" label on a message.
// Discord's API doesn't expose full edit history for standard users, so we
// cache message content in-session and diff against the current text.

interface MsgSnapshot { content: string; ts: number; }
const snapshots = new Map<string, MsgSnapshot[]>();

const STYLE_ID = "sc-message-diff";
const CSS = `
.sc-diff-popup {
    position: absolute;
    z-index: 9999;
    background: var(--background-floating);
    border: 1px solid var(--background-modifier-accent);
    border-radius: 8px;
    padding: 10px 14px;
    min-width: 240px;
    max-width: 480px;
    font-size: 14px;
    line-height: 1.5;
    pointer-events: none;
    box-shadow: 0 8px 24px rgba(0,0,0,0.35);
    animation: fadeIn 120ms ease;
}
.sc-diff-del { background: rgba(240,71,71,.25); text-decoration: line-through; border-radius: 3px; padding: 0 2px; }
.sc-diff-ins { background: rgba(59,165,93,.30); border-radius: 3px; padding: 0 2px; }
.sc-diff-header { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; } }
`;

const settings = definePluginSettings({
    keepSnapshots: {
        type: OptionType.NUMBER,
        description: "Maximum edit snapshots per message to keep in memory",
        default: 5,
    },
});

/** Word-level diff: returns HTML string */
function wordDiff(before: string, after: string): string {
    const a = before.split(/\b/);
    const b = after.split(/\b/);
    // naive LCS-based diff (O(n²) fine for short messages)
    const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--)
        for (let j = b.length - 1; j >= 0; j--)
            dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

    let i = 0, j = 0;
    const parts: string[] = [];
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    while (i < a.length || j < b.length) {
        if (i < a.length && j < b.length && a[i] === b[j]) {
            parts.push(esc(a[i++])); j++;
        } else if (j < b.length && (i >= a.length || dp[i][j + 1] >= dp[i + 1][j])) {
            parts.push(`<span class="sc-diff-ins">${esc(b[j++])}</span>`);
        } else {
            parts.push(`<span class="sc-diff-del">${esc(a[i++])}</span>`);
        }
    }
    return parts.join("");
}

function showDiff(anchor: HTMLElement, messageId: string, currentContent: string) {
    const snaps = snapshots.get(messageId);
    const before = snaps?.[snaps.length - 1]?.content ?? "";
    if (!before || before === currentContent) return;

    const popup = document.createElement("div");
    popup.className = "sc-diff-popup";
    popup.innerHTML = `<div class="sc-diff-header">Edit diff</div>${wordDiff(before, currentContent)}`;

    const rect = anchor.getBoundingClientRect();
    popup.style.top = `${rect.bottom + 6 + window.scrollY}px`;
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.id = "sc-diff-popup-active";
    document.body.appendChild(popup);
}

function hideDiff() {
    document.getElementById("sc-diff-popup-active")?.remove();
}

function onMouseOver(e: MouseEvent) {
    const target = (e.target as HTMLElement).closest?.("[class*='edited_']") as HTMLElement | null;
    if (!target) return;
    const msgEl = target.closest?.("[id^='chat-messages-']") as HTMLElement | null;
    if (!msgEl) return;
    const msgId = msgEl.id.replace("chat-messages-", "").split("-").pop() ?? "";
    const contentEl = msgEl.querySelector<HTMLElement>("[class*='messageContent_']");
    if (!msgId || !contentEl) return;
    showDiff(target, msgId, contentEl.textContent ?? "");
}

function onMutations(muts: MutationRecord[]) {
    for (const m of muts) {
        const msgEl = (m.target as HTMLElement).closest?.("[id^='chat-messages-']") as HTMLElement | null;
        if (!msgEl) continue;
        const msgId = msgEl.id.replace("chat-messages-", "").split("-").pop() ?? "";
        if (!msgId) continue;
        const contentEl = msgEl.querySelector<HTMLElement>("[class*='messageContent_']");
        if (!contentEl) continue;
        const text = contentEl.textContent ?? "";
        const snaps = snapshots.get(msgId) ?? [];
        if (!snaps.length || snaps[snaps.length - 1].content !== text) {
            snaps.push({ content: text, ts: Date.now() });
            const max = settings.store.keepSnapshots ?? 5;
            if (snaps.length > max) snaps.shift();
            snapshots.set(msgId, snaps);
        }
    }
}

let mo: MutationObserver | null = null;

export default definePlugin({
    name: "MessageDiff",
    description: "Shows a word-level diff overlay when hovering the '(edited)' label of a message. Tracks in-session edits automatically.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);

        document.addEventListener("mouseover", onMouseOver, true);
        document.addEventListener("mouseout", e => {
            if ((e.target as HTMLElement).closest?.("[class*='edited_']")) hideDiff();
        }, true);

        mo = new MutationObserver(onMutations);
        const chat = document.querySelector("[class*='messagesWrapper_']") ?? document.body;
        mo.observe(chat, { childList: true, subtree: true, characterData: true });
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
        document.removeEventListener("mouseover", onMouseOver, true);
        mo?.disconnect(); mo = null;
        hideDiff();
        snapshots.clear();
    },
});
