/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Right-click any message → "Add/Edit Note" to attach a private sticky note.
// Notes are stored locally via DataStore and shown as a small indicator below
// the message content.

const STORE_KEY = "ContextNotes";
const STYLE_ID  = "sc-context-notes";

interface NoteMap { [messageId: string]: string; }
let notes: NoteMap = {};

const CSS = `
.sc-note-badge {
    display: inline-block;
    margin-top: 3px;
    padding: 3px 8px;
    background: var(--background-modifier-accent);
    border-left: 3px solid var(--brand-experiment);
    border-radius: 0 4px 4px 0;
    font-size: 12px;
    color: var(--text-muted);
    max-width: 480px;
    white-space: pre-wrap;
    word-break: break-word;
    cursor: pointer;
    transition: background .15s;
}
.sc-note-badge:hover {
    background: var(--background-modifier-hover);
    color: var(--text-normal);
}
`;

async function loadNotes() {
    notes = (await DataStore.get<NoteMap>(STORE_KEY)) ?? {};
}

async function saveNotes() {
    await DataStore.set(STORE_KEY, notes);
}

function renderNotes() {
    // Remove all existing badges then re-render
    document.querySelectorAll(".sc-note-badge").forEach(el => el.remove());
    for (const [msgId, text] of Object.entries(notes)) {
        if (!text) continue;
        const msgEl = document.querySelector<HTMLElement>(`[id*="${msgId}"]`);
        if (!msgEl) continue;
        const contentEl = msgEl.querySelector<HTMLElement>("[class*='messageContent_']");
        if (!contentEl) continue;
        const badge = document.createElement("div");
        badge.className = "sc-note-badge";
        badge.textContent = `📌 ${text}`;
        badge.title = "Click to edit this note (ContextNotes plugin)";
        badge.addEventListener("click", () => openNoteEditor(msgId));
        contentEl.insertAdjacentElement("afterend", badge);
    }
}

function openNoteEditor(messageId: string) {
    const existing = notes[messageId] ?? "";
    const input = prompt("Edit note for this message (clear to remove):", existing);
    if (input === null) return; // cancelled
    if (input.trim() === "") {
        delete notes[messageId];
    } else {
        notes[messageId] = input.trim();
    }
    saveNotes();
    renderNotes();
}

let renderInterval: ReturnType<typeof setInterval> | null = null;

export default definePlugin({
    name: "ContextNotes",
    description: "Right-click any message to attach a private sticky note. Notes are stored locally and shown as a small pinned badge below the message.",
    authors: [Devs._7n7],

    contextMenus: {
        "message"(children: any[], props: any) {
            const messageId: string = props?.message?.id;
            if (!messageId) return;
            const existing = notes[messageId];
            children.push({
                type: "button",
                label: existing ? "Edit/Remove Note 📌" : "Add Note 📌",
                action: () => openNoteEditor(messageId),
                id: "swancord-context-notes",
                danger: false,
                icon: void 0,
            } as any);
        },
    },

    async start() {
        await loadNotes();

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);

        renderInterval = setInterval(renderNotes, 2500);
        setTimeout(renderNotes, 800);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
        document.querySelectorAll(".sc-note-badge").forEach(el => el.remove());
        if (renderInterval) { clearInterval(renderInterval); renderInterval = null; }
    },
});
