/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { UploadManager } from "@webpack/common";

const settings = definePluginSettings({
    shortcut: {
        type: OptionType.SELECT,
        description: "Keyboard shortcut to paste clipboard text as a .txt file",
        options: [
            { label: "Ctrl+Shift+V", value: "ctrl-shift-v", default: true },
            { label: "Ctrl+Alt+V", value: "ctrl-alt-v" },
        ],
    },
    filename: {
        type: OptionType.STRING,
        description: "Default filename for pasted text files (without extension)",
        default: "paste",
    },
});

async function handlePasteAsFile(e: KeyboardEvent) {
    const s = settings.store.shortcut;
    const match =
        (s === "ctrl-shift-v" && e.ctrlKey && e.shiftKey && !e.altKey && e.key === "V") ||
        (s === "ctrl-alt-v" && e.ctrlKey && e.altKey && !e.shiftKey && e.key === "V");
    if (!match) return;

    const target = document.activeElement as HTMLElement | null;
    const isInput =
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLInputElement ||
        target?.getAttribute("contenteditable") === "true";
    if (!isInput) return;

    e.preventDefault();
    e.stopPropagation();

    try {
        const text = await navigator.clipboard.readText();
        if (!text) return;

        const name = `${settings.store.filename || "paste"}.txt`;
        const file = new File([text], name, { type: "text/plain" });

        // Find the active channel's input via UploadManager
        const channel = (window as any).DiscordNative?.clipboard
            ?? null; // fallback handled below
        void channel;

        UploadManager?.clearAll?.();
        UploadManager?.addFile?.({
            channelId: (document.querySelector("[data-slate-editor]")
                ?.closest("[class*='channelTextArea']") as any)
                ?.__reactFiber?.return?.stateNode?.props?.channel?.id
                ?? "",
            file: { file, name, isImage: false, platform: 1 },
            draftType: 0,
        });
    } catch {
        // Clipboard access denied — silently ignore
    }
}

export default definePlugin({
    name: "PasteAsFile",
    description: "Press Ctrl+Shift+V to paste clipboard text as a .txt file attachment instead of inline text.",
    authors: [Devs._7n7],
    settings,

    start() {
        window.addEventListener("keydown", handlePasteAsFile, true);
    },

    stop() {
        window.removeEventListener("keydown", handlePasteAsFile, true);
    },
});
