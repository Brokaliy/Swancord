/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as DataStore from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, SelectedChannelStore } from "@webpack/common";

const DS_KEY = "SwancordDrafts_v1";

// Map<channelId, draftText>
let drafts: Record<string, string> = {};
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let currentChannelId: string | null = null;

async function loadDrafts() {
    drafts = (await DataStore.get(DS_KEY)) ?? {};
}

async function saveDrafts() {
    await DataStore.set(DS_KEY, drafts);
}

function getTextarea(): HTMLTextAreaElement | null {
    return document.querySelector<HTMLTextAreaElement>(
        "[class*=\"slateTextArea_\"] [contenteditable=\"true\"], [class*=\"textArea_\"] [contenteditable=\"true\"]"
    ) as any;
}

function onInput() {
    if (!currentChannelId) return;
    const el = getTextarea();
    const text = el?.textContent?.trim() ?? "";
    if (text) {
        drafts[currentChannelId] = text;
    } else {
        delete drafts[currentChannelId];
    }
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDrafts, 800);
}

function applyDraft(channelId: string) {
    const draft = drafts[channelId];
    if (!draft) return;
    // Wait for Discord to mount the textarea
    const attempt = (retries = 8) => {
        const el = getTextarea();
        if (el) {
            // Discord uses contenteditable — set innerText and fire input event
            el.focus();
            document.execCommand("insertText", false, draft);
            return;
        }
        if (retries > 0) setTimeout(() => attempt(retries - 1), 120);
    };
    attempt();
}

function onChannelSelect(event: any) {
    const newId: string | null = event?.channelId ?? null;
    currentChannelId = newId;
    if (newId) setTimeout(() => applyDraft(newId), 200);
}

export default definePlugin({
    name: "MessageDraft",
    description: "Persists unsent message drafts across restarts. Switch channels and your in-progress message is saved.",
    authors: [Devs._7n7],

    async start() {
        await loadDrafts();
        currentChannelId = SelectedChannelStore.getChannelId() ?? null;
        // Listen for channel switches
        FluxDispatcher.subscribe("CHANNEL_SELECT", onChannelSelect);
        // Listen for typing
        document.addEventListener("input", onInput, true);
    },

    stop() {
        FluxDispatcher.unsubscribe("CHANNEL_SELECT", onChannelSelect);
        document.removeEventListener("input", onInput, true);
        if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    },
});
