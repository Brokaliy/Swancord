/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, PresenceStore } from "@webpack/common";
import { startDetection, stopDetection, swancordDetected } from "./swancordDetection";

const EL_ID    = "sc-swc-count";
const STYLE_ID = "sc-swc-count-style";

// ── DOM widget ────────────────────────────────────────────────────────────

function recount() {
    const total  = swancordDetected.size;
    let online = 0;
    swancordDetected.forEach(id => {
        const s = PresenceStore.getStatus(id);
        if (s === "online" || s === "idle" || s === "dnd") online++;
    });
    updateWidget(total, online);
}

function getOrCreateWidget(): HTMLElement {
    let el = document.getElementById(EL_ID);
    if (!el) {
        el = document.createElement("div");
        el.id = EL_ID;
        document.body.appendChild(el);
    }
    return el;
}

function updateWidget(total = swancordDetected.size, online = 0) {
    const el = getOrCreateWidget();

    // Only show when the friends/people page is open
    const onFriendsPage = !!document.querySelector("[class*=\"peopleColumn_\"]");
    el.style.display = onFriendsPage ? "flex" : "none";
    if (!onFriendsPage) return;

    el.innerHTML = `
        <span class="sc-sc-icon">🦢</span>
        <span class="sc-sc-label">Swancord Users</span>
        <span class="sc-sc-counts">
            <span class="sc-sc-online">${online} online</span>
            <span class="sc-sc-sep">·</span>
            <span class="sc-sc-total">${total} total</span>
        </span>
    `;
}

function removeWidget() {
    document.getElementById(EL_ID)?.remove();
}

let pollInterval: ReturnType<typeof setInterval> | null = null;

function startObserver() {
    if (pollInterval) return;
    // Poll at low frequency — much safer than MutationObserver on document.body
    pollInterval = setInterval(() => {
        const onFriendsPage = !!document.querySelector("[class*=\"peopleColumn_\"]");
        const el = document.getElementById(EL_ID);
        if (onFriendsPage) {
            updateWidget();
        } else if (el) {
            el.style.display = "none";
        }
    }, 750);
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
    description: "Shows a live count of all Swancord users (and how many are online) at the top of the Friends page. Detects Swancord users via an invisible message watermark.",
    authors: [Devs._7n7],
    required: true,
    dependencies: ["MessageEventsAPI"],

    start() {
        injectStyle();
        startDetection();      // also handles self-registration
        startObserver();
        FluxDispatcher.subscribe("PRESENCE_UPDATES", recount);
        recount();             // initial render with current data
    },

    stop() {
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        stopDetection();
        FluxDispatcher.unsubscribe("PRESENCE_UPDATES", recount);
        removeWidget();
        document.getElementById(STYLE_ID)?.remove();
    },
});
