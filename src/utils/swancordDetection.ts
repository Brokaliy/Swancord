/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Watermark-based Swancord user detection.
 * This module appends an invisible Unicode sequence to every outgoing message
 * and detects that sequence in messages received from other users, building a
 * local in-memory set of known Swancord users — no server needed.
 *
 * Imported by swancordBadge.tsx and swancordUsersCount.ts.
 * Both plugins must declare  dependencies: ["MessageEventsAPI"]
 */

import { addMessagePreEditListener, addMessagePreSendListener, removeMessagePreEditListener, removeMessagePreSendListener } from "@api/MessageEvents";
import type { MessageEditListener, MessageSendListener } from "@api/MessageEvents";
import { FluxDispatcher, UserStore } from "@webpack/common";

// ── Watermark ─────────────────────────────────────────────────────────────────
// Six invisible Unicode characters: ZWSP · ZWNJ · ZWJ · WJ · ZWNJ · ZWSP
// The specific combination is unique to Swancord and undetectable to the eye.
export const WATERMARK = "\u200b\u200c\u200d\u2060\u200c\u200b";

// ── Shared registry ───────────────────────────────────────────────────────────
/** Set of Discord user IDs known to be running Swancord in this session. */
export const swancordDetected = new Set<string>();

// ── Ref-counting so both plugins can start/stop independently ─────────────────
let refCount = 0;

// ── Listeners ─────────────────────────────────────────────────────────────────
const preSendListener: MessageSendListener = (_channelId, msg) => {
    if (!msg.content.includes(WATERMARK)) msg.content += WATERMARK;
};

const preEditListener: MessageEditListener = (_channelId, _msgId, msg) => {
    if (!msg.content.includes(WATERMARK)) msg.content += WATERMARK;
};

function onFluxMessage(event: any) {
    const msg = event.message;
    if (msg?.author?.id && typeof msg.content === "string" && msg.content.includes(WATERMARK)) {
        swancordDetected.add(msg.author.id as string);
    }
}

function selfRegister() {
    const me = UserStore.getCurrentUser();
    if (me?.id) swancordDetected.add(me.id);
}

// ── Public API ────────────────────────────────────────────────────────────────
export function startDetection() {
    if (++refCount > 1) return; // already running

    // Register ourselves immediately — we know we're on Swancord
    selfRegister();
    // Retry on connect in case getCurrentUser() wasn't ready yet
    FluxDispatcher.subscribe("CONNECTION_OPEN", selfRegister);

    addMessagePreSendListener(preSendListener);
    addMessagePreEditListener(preEditListener);
    FluxDispatcher.subscribe("MESSAGE_CREATE", onFluxMessage);
    FluxDispatcher.subscribe("MESSAGE_UPDATE", onFluxMessage);
}

export function stopDetection() {
    if (--refCount > 0) return; // still needed by the other plugin

    FluxDispatcher.unsubscribe("CONNECTION_OPEN", selfRegister);
    removeMessagePreSendListener(preSendListener);
    removeMessagePreEditListener(preEditListener);
    FluxDispatcher.unsubscribe("MESSAGE_CREATE", onFluxMessage);
    FluxDispatcher.unsubscribe("MESSAGE_UPDATE", onFluxMessage);
    swancordDetected.clear();
}
