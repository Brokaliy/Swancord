/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

const UserProfileStore = findByPropsLazy("getUserProfile", "getGuildMemberProfile");
const MessageStore = findByPropsLazy("getMessage", "getMessages");

function intToHex(n: number): string {
    return "#" + (n & 0xFFFFFF).toString(16).padStart(6, "0");
}

// Returns the display color for a user — tries multiple profile color sources
function getProfileColor(userId: string, guildId?: string | null): string | null {
    try {
        // Guild-specific profile — colorString is set for role colors
        if (guildId) {
            const gp = UserProfileStore?.getGuildMemberProfile?.(userId, guildId);
            if (gp?.colorString) return gp.colorString;
            if (typeof gp?.accentColor === "number" && gp.accentColor) return intToHex(gp.accentColor);
            if (gp?.themeColors?.[0]) return intToHex(gp.themeColors[0]);
        }
        // Global user profile
        const p = UserProfileStore?.getUserProfile?.(userId);
        if (p?.accentColor != null) return intToHex(p.accentColor);
        if (p?.themeColors?.[0]) return intToHex(p.themeColors[0]);
        if ((p as any)?.primaryColor) return intToHex((p as any).primaryColor);
    } catch (_) {}
    return null;
}

// Find the username element inside a message list item
function getUsernameEl(li: HTMLElement): HTMLElement | null {
    const selectors = [
        "[class*='usernameClickable_']",
        "[class*='username_']",
        "[class*='usernameInner_']",
        "[class*='messageUsername_']",
        "[class*='colorStandard_'][class*='username']",
        "[class*='headerText_'] span",
    ];
    for (const sel of selectors) {
        const el = li.querySelector<HTMLElement>(sel);
        if (el) return el;
    }
    return null;
}

function applyToMessage(li: HTMLElement) {
    if (li.dataset.scStyled === "1") return;

    const parts = li.id?.split("-") ?? [];
    if (parts.length < 4) return;
    const msgId = parts[parts.length - 1];
    const channelId = parts.slice(2, -1).join("-");

    const msg = (MessageStore as any)?.getMessage?.(channelId, msgId);
    const authorId = msg?.author?.id;
    if (!authorId) return;

    const guildId = msg?.guild_id ?? null;
    const color = getProfileColor(authorId, guildId);
    if (!color) return;

    const usernameEl = getUsernameEl(li);
    if (usernameEl) {
        usernameEl.style.setProperty("color", color, "important");
        li.dataset.scStyled = "1";
    }
}

function styleAll() {
    document.querySelectorAll<HTMLElement>("[id^='chat-messages-']:not([data-sc-styled='1'])").forEach(applyToMessage);
}

let observer: MutationObserver | null = null;

export default definePlugin({
    name: "AlwaysStyle",
    description: "Always shows custom username colors from Nitro profile customization in chat messages, not just on hover.",
    authors: [Devs._7n7],

    start() {
        styleAll();

        observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (!(node instanceof HTMLElement)) continue;
                    if (node.id?.startsWith("chat-messages-")) {
                        applyToMessage(node);
                    } else {
                        node.querySelectorAll<HTMLElement>("[id^='chat-messages-']:not([data-sc-styled='1'])")
                            .forEach(applyToMessage);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });

        FluxDispatcher.subscribe("CHANNEL_SELECT", () => setTimeout(styleAll, 300));
        FluxDispatcher.subscribe("MESSAGE_CREATE", () => setTimeout(styleAll, 150));
    },

    stop() {
        observer?.disconnect();
        observer = null;

        document.querySelectorAll<HTMLElement>("[data-sc-styled='1']").forEach(el => {
            getUsernameEl(el)?.style.removeProperty("color");
            delete el.dataset.scStyled;
        });

        FluxDispatcher.unsubscribe("CHANNEL_SELECT", () => {});
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", () => {});
    },
});
