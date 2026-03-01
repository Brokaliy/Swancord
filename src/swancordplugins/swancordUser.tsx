/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addProfileBadge, BadgePosition, ProfileBadge, removeProfileBadge } from "@api/Badges";
import * as DataStore from "@api/DataStore";
import { addMessagePreSendListener, removeMessagePreSendListener } from "@api/MessageEvents";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

// Invisible Unicode tag-block characters (U+E0073 U+E0077 U+E0063 = "swc").
// These characters are in the Unicode Tags block (U+E0000–U+E007F) and are
// completely invisible in all Discord clients, apps, and web browsers.
// They survive Discord's message storage unchanged.
const WATERMARK = "\u{E0073}\u{E0077}\u{E0063}";
const STORE_KEY  = "SwancordUsers_v1";

// In-memory cache so we don't hit DataStore on every badge check
let detectedUsers = new Set<string>();

async function loadCache() {
    const stored = await DataStore.get<string[]>(STORE_KEY);
    detectedUsers = new Set(stored ?? []);
}

async function saveUser(userId: string) {
    if (detectedUsers.has(userId)) return;
    detectedUsers.add(userId);
    await DataStore.set(STORE_KEY, [...detectedUsers]);
}

// ── Outgoing: append the watermark to every message we send ──────────────
const preSendListener = (_channelId: string, msg: { content: string }) => {
    // Don't double-stamp if somehow already present
    if (!msg.content.includes(WATERMARK)) {
        msg.content += WATERMARK;
    }
};

// ── Incoming: detect the watermark in messages from other users ──────────
function onMessageCreate(event: any) {
    const msg = event.message;
    if (!msg?.author?.id || !msg?.content) return;
    const me = UserStore.getCurrentUser();
    // Skip our own messages — we already know we use Swancord
    if (me && msg.author.id === me.id) return;
    if (msg.content.includes(WATERMARK)) {
        saveUser(msg.author.id);
    }
}

// ── Badge definition ──────────────────────────────────────────────────────
const SwancordUserBadge: ProfileBadge = {
    description: "Uses Swancord",
    // Re-use the existing SwancordIcon that's already deployed
    iconSrc: "https://7n7.dev/badges/SwancordIcon.png",
    position: BadgePosition.END,
    props: {
        style: {
            borderRadius: "50%",
            transform: "scale(0.85)",
            // Subtle cyan tint so it's visually distinct from the creator badge
            filter: "hue-rotate(160deg) saturate(1.3)",
        },
    },
    shouldShow: ({ userId }) => detectedUsers.has(userId),
    onClick: () => window.open("https://7n7.dev/swancord", "_blank"),
};

export default definePlugin({
    name: "SwancordUser",
    description: "Silently marks your messages so other Swancord users can be detected, then shows a badge on their profile.",
    authors: [Devs._7n7],
    // MessageEventsAPI is required for the pre-send listener
    dependencies: ["MessageEventsAPI"],

    async start() {
        await loadCache();
        addMessagePreSendListener(preSendListener);
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
        addProfileBadge(SwancordUserBadge);
    },

    stop() {
        removeMessagePreSendListener(preSendListener);
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
        removeProfileBadge(SwancordUserBadge);
    },
});
