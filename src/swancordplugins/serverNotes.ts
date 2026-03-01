/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Personal per-server notes stored in Swancord settings
// Press Alt+Shift+N to open/edit the note for the current server

const WIDGET_ID = "swancord-server-notes-modal";

function getNotes(): Record<string, string> {
    if (!(Settings as any).serverNotes) (Settings as any).serverNotes = {};
    return (Settings as any).serverNotes;
}

function setNote(guildId: string, text: string) {
    const notes = getNotes();
    notes[guildId] = text;
    (Settings as any).serverNotes = notes;
}

function getCurrentGuildId(): string | null {
    const match = location.href.match(/\/channels\/(\d+)/);
    if (!match) return null;
    const id = match[1];
    return id === "@me" ? null : id;
}

function openNoteModal() {
    const guildId = getCurrentGuildId();
    if (!guildId || guildId === "@me") return;

    // Remove existing modal if open
    document.getElementById(WIDGET_ID)?.remove();

    const notes = getNotes();
    const current = notes[guildId] ?? "";

    const overlay = document.createElement("div");
    overlay.id = WIDGET_ID;
    overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(0,0,0,0.6);
        display: flex; align-items: center; justify-content: center; z-index: 99999;
    `;

    const box = document.createElement("div");
    box.style.cssText = `
        background: #111; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px;
        padding: 20px; width: 420px; display: flex; flex-direction: column; gap: 12px;
    `;

    const title = document.createElement("div");
    title.textContent = `Notes for server ${guildId}`;
    title.style.cssText = "font-size: 13px; color: rgba(255,255,255,0.6); font-weight: 600;";

    const textarea = document.createElement("textarea");
    textarea.value = current;
    textarea.placeholder = "Write your notes here…";
    textarea.style.cssText = `
        background: #1a1a1a; border: 1px solid rgba(255,255,255,0.08); border-radius: 6px;
        color: #e0e0e0; padding: 10px; font-size: 14px; min-height: 140px; resize: vertical;
        font-family: inherit; outline: none;
    `;

    const row = document.createElement("div");
    row.style.cssText = "display: flex; justify-content: flex-end; gap: 8px;";

    const cancel = document.createElement("button");
    cancel.textContent = "Cancel";
    cancel.style.cssText = "padding: 6px 14px; border-radius: 6px; background: rgba(255,255,255,0.06); color: #ccc; border: none; cursor: pointer;";
    cancel.onclick = () => overlay.remove();

    const save = document.createElement("button");
    save.textContent = "Save";
    save.style.cssText = "padding: 6px 14px; border-radius: 6px; background: rgba(255,255,255,0.12); color: #fff; border: none; cursor: pointer;";
    save.onclick = () => { setNote(guildId, textarea.value); overlay.remove(); };

    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    row.append(cancel, save);
    box.append(title, textarea, row);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    textarea.focus();
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "N") {
        e.preventDefault();
        openNoteModal();
    }
}

export default definePlugin({
    name: "ServerNotes",
    description: "Store personal notes per server — press Alt+Shift+N to open the note editor for the current server.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        document.getElementById(WIDGET_ID)?.remove();
    },
});
