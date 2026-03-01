/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, PresenceStore } from "@webpack/common";

const API      = "https://7n7hub.pages.dev/swancord/users";
const EL_ID    = "sc-swc-count";
const STYLE_ID = "sc-swc-count-style";

let totalUsers  = 0;
let onlineUsers = 0;
const swancordIds = new Set<string>();

async function fetchRegistry() {
    try {
        const res  = await fetch(API);
        const data = await res.json() as { users: string[] };
        swancordIds.clear();
        (data.users ?? []).forEach(id => swancordIds.add(id));
        totalUsers = swancordIds.size;
        recount();
    } catch { /* silent */ }
}

function recount() {
    totalUsers = swancordIds.size;
    onlineUsers = 0;
    swancordIds.forEach(id => {
        const s = PresenceStore.getStatus(id);
        if (s === "online" || s === "idle" || s === "dnd") onlineUsers++;
    });
    updateWidget();
}

// ── DOM widget ────────────────────────────────────────────────────────────

function getOrCreateWidget(): HTMLElement {
    let el = document.getElementById(EL_ID);
    if (!el) {
        el = document.createElement("div");
        el.id = EL_ID;
        document.body.appendChild(el);
    }
    return el;
}

function updateWidget() {
    const el = getOrCreateWidget();

    // Only show when the friends/people page is open
    const onFriendsPage = !!document.querySelector("[class*=\"peopleColumn_\"]");
    el.style.display = onFriendsPage ? "flex" : "none";
    if (!onFriendsPage) return;

    el.innerHTML = `
        <span class="sc-sc-icon">🦢</span>
        <span class="sc-sc-label">Swancord Users</span>
        <span class="sc-sc-counts">
            <span class="sc-sc-online">${onlineUsers} online</span>
            <span class="sc-sc-sep">·</span>
            <span class="sc-sc-total">${totalUsers} total</span>
        </span>
    `;
}

function removeWidget() {
    document.getElementById(EL_ID)?.remove();
}

let observer: MutationObserver | null = null;

function startObserver() {
    if (observer) return;
    observer = new MutationObserver(() => {
        if (document.querySelector("[class*=\"peopleColumn_\"]")) {
            updateWidget();
        } else {
            removeWidget();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        #${EL_ID} {
            display: none;
            position: fixed;
            top: 48px;
            left: 50%;
            transform: translateX(-50%);
            align-items: center;
            gap: 6px;
            padding: 5px 14px;
            font-size: 0.72rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: var(--text-muted);
            background: var(--background-secondary);
            border: 1px solid var(--background-modifier-accent);
            border-radius: 0 0 8px 8px;
            z-index: 100;
            pointer-events: none;
            white-space: nowrap;
        }
        #${EL_ID} .sc-sc-label  { color: var(--header-secondary); margin-right: 2px; }
        #${EL_ID} .sc-sc-online { color: #23a55a; font-weight: 700; }
        #${EL_ID} .sc-sc-sep    { opacity: 0.4; }
        #${EL_ID} .sc-sc-total  { color: var(--text-muted); }
    `;
    document.head.appendChild(style);
}

export default definePlugin({
    name: "SwancordUsersCount",
    description: "Shows a live count of all Swancord users (and how many are online) at the top of the Friends page.",
    authors: [Devs._7n7],
    required: true,

    async start() {
        injectStyle();
        await fetchRegistry();
        startObserver();
        FluxDispatcher.subscribe("PRESENCE_UPDATES", recount);
    },

    stop() {
        observer?.disconnect();
        observer = null;
        FluxDispatcher.unsubscribe("PRESENCE_UPDATES", recount);
        removeWidget();
        document.getElementById(STYLE_ID)?.remove();
        swancordIds.clear();
    },
});
