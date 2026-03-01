/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

const EL_ID    = "sc-charcount";
const STYLE_ID  = "sc-charcount-style";

const DISCORD_LIMIT = 2000;

const settings = definePluginSettings({
    showBelow: {
        type: OptionType.NUMBER,
        description: "Only show the counter when character count is above this threshold (0 = always show)",
        default: 0,
    },
    warnAt: {
        type: OptionType.NUMBER,
        description: "Character count at which the counter turns orange",
        default: 1500,
    },
    dangerAt: {
        type: OptionType.NUMBER,
        description: "Character count at which the counter turns red",
        default: 1900,
    },
});

function getEl(): HTMLElement | null {
    return document.getElementById(EL_ID);
}

function ensureEl(): HTMLElement {
    let el = getEl();
    if (el) return el;
    el = document.createElement("div");
    el.id = EL_ID;
    document.body.appendChild(el);
    return el;
}

function updateCounter(length: number) {
    const el = ensureEl();
    const remaining = DISCORD_LIMIT - length;
    const threshold = settings.store.showBelow;

    if (length <= threshold) {
        el.style.opacity = "0";
        return;
    }

    el.textContent = remaining < 0
        ? `${Math.abs(remaining)} over limit`
        : `${remaining}`;

    if (length >= settings.store.dangerAt) {
        el.dataset.state = "danger";
    } else if (length >= settings.store.warnAt) {
        el.dataset.state = "warn";
    } else {
        el.dataset.state = "ok";
    }

    el.style.opacity = "1";
}

function onDraftSave(event: any) {
    // type 0 = regular message draft (not thread title, search, etc.)
    if (event.type !== 0) return;
    updateCounter((event.content ?? "").length);
}

function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        #${EL_ID} {
            position: fixed;
            bottom: 68px;
            right: 20px;
            font-size: 0.72rem;
            font-weight: 600;
            font-family: var(--font-code);
            letter-spacing: 0.04em;
            opacity: 0;
            z-index: 9999;
            pointer-events: none;
            padding: 2px 6px;
            border-radius: 4px;
            transition: opacity 0.15s, color 0.2s, background 0.2s;
            background: var(--background-floating, #18191c);
        }
        #${EL_ID}[data-state="ok"]     { color: var(--text-muted, #72767d); }
        #${EL_ID}[data-state="warn"]   { color: #f97316; }
        #${EL_ID}[data-state="danger"] { color: #ed4245; }
    `;
    document.head.appendChild(style);
}

export default definePlugin({
    name: "CharacterBar",
    description: "Shows a live character count near the message box. Updates as you type using Discord's draft system.",
    authors: [Devs._7n7],
    settings,

    start() {
        injectStyle();
        FluxDispatcher.subscribe("DRAFT_SAVE", onDraftSave);
    },

    stop() {
        FluxDispatcher.unsubscribe("DRAFT_SAVE", onDraftSave);
        document.getElementById(EL_ID)?.remove();
        document.getElementById(STYLE_ID)?.remove();
    },
});
