/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Client-side drag-reorder for channels within sections.
// The custom order is persisted in localStorage and applied
// via CSS order property every time.

const STORE_KEY = "ChannelSortOrder";
const STYLE_ID = "sc-channel-sort";

interface SortOrder { [guildId: string]: { [sectionId: string]: string[]; }; }

function loadOrder(): SortOrder {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}"); } catch { return {}; }
}

function saveOrder(order: SortOrder) {
    localStorage.setItem(STORE_KEY, JSON.stringify(order));
}

function getCurrentGuildId(): string {
    return location.pathname.match(/\/channels\/(\d+)/)?.[1] ?? "@me";
}

function applyOrder() {
    const order = loadOrder();
    const guildId = getCurrentGuildId();
    const guildOrder = order[guildId];
    if (!guildOrder) return;

    for (const [, channelIds] of Object.entries(guildOrder)) {
        channelIds.forEach((id, idx) => {
            const el = document.querySelector<HTMLElement>(`[data-list-item-id$='${id}']`);
            if (el) el.style.order = String(idx);
        });
    }
}

function buildStyle(): string {
    return `
/* ChannelSort: make channel containers flex so order property works */
[class*="children_"][class*="channel"],
[class*="scroller_"][aria-label*="channel"] {
    display: flex !important;
    flex-direction: column;
}
`;
}

// Drag state
let dragEl: HTMLElement | null = null;
let dragChannelId = "";
let ghostEl: HTMLElement | null = null;

function onDragStart(e: DragEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-list-item-id^='channels___']");
    if (!target) return;
    dragEl = target;
    dragChannelId = target.dataset.listItemId?.split("___")[1] ?? "";
    target.style.opacity = "0.5";
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", dragChannelId);
    }
}

function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!dragEl) return;
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-list-item-id^='channels___']");
    if (!target || target === dragEl) return;
    e.dataTransfer!.dropEffect = "move";
    // Visual reorder hint
    const parent = target.parentElement;
    if (!parent) return;
    const targetRect = target.getBoundingClientRect();
    const midY = targetRect.top + targetRect.height / 2;
    if (e.clientY < midY) {
        parent.insertBefore(dragEl, target);
    } else {
        parent.insertBefore(dragEl, target.nextSibling);
    }
}

function onDrop(e: DragEvent) {
    e.preventDefault();
    if (!dragEl) return;
    dragEl.style.opacity = "";
    // Persist new order
    const guildId = getCurrentGuildId();
    const parent = dragEl.parentElement;
    if (!parent) return;
    const siblings = Array.from(parent.querySelectorAll<HTMLElement>("[data-list-item-id^='channels___']"));
    const ids = siblings.map(el => el.dataset.listItemId?.split("___")[1] ?? "").filter(Boolean);
    const order = loadOrder();
    if (!order[guildId]) order[guildId] = {};
    order[guildId]["_default"] = ids;
    saveOrder(order);
    dragEl = null;
    dragChannelId = "";
}

function onDragEnd() {
    if (dragEl) { dragEl.style.opacity = ""; dragEl = null; }
}

function enableDrag() {
    document.querySelectorAll<HTMLElement>("[data-list-item-id^='channels___']").forEach(el => {
        if (el.dataset.sortDrag) return;
        el.draggable = true;
        el.dataset.sortDrag = "1";
    });
}

let enableInterval: ReturnType<typeof setInterval> | null = null;

export default definePlugin({
    name: "ChannelSort",
    description: "Drag-to-reorder channels client-side within any channel section. Order is saved per-server in localStorage.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = buildStyle();
        document.head.appendChild(style);

        document.addEventListener("dragstart", onDragStart, true);
        document.addEventListener("dragover", onDragOver, true);
        document.addEventListener("drop", onDrop, true);
        document.addEventListener("dragend", onDragEnd, true);

        enableInterval = setInterval(() => { enableDrag(); applyOrder(); }, 2000);
        setTimeout(() => { enableDrag(); applyOrder(); }, 500);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
        document.removeEventListener("dragstart", onDragStart, true);
        document.removeEventListener("dragover", onDragOver, true);
        document.removeEventListener("drop", onDrop, true);
        document.removeEventListener("dragend", onDragEnd, true);
        if (enableInterval) { clearInterval(enableInterval); enableInterval = null; }
        // Remove drag handles
        document.querySelectorAll<HTMLElement>("[data-sort-drag]").forEach(el => {
            el.draggable = false;
            delete el.dataset.sortDrag;
            el.style.order = "";
        });
    },
});
