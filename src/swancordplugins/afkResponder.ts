/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher, UserStore } from "@webpack/common";

const MessageActions = findByPropsLazy("sendMessage");

const settings = definePluginSettings({
    message: {
        type: OptionType.STRING,
        description: "Auto-reply message sent when you are AFK and someone mentions you",
        default: "I'm AFK right now, I'll get back to you soon!",
    },
    cooldownSeconds: {
        type: OptionType.NUMBER,
        description: "Minimum seconds between auto-replies to the same person (0 = always reply)",
        default: 60,
    },
});

let afkEnabled = false;
const lastReplied = new Map<string, number>();

function onMessage(event: any) {
    if (!afkEnabled) return;
    const msg = event?.message;
    if (!msg) return;

    const me = UserStore.getCurrentUser?.();
    if (!me) return;
    if (msg.author?.id === me.id) return;

    // Only reply if we are mentioned
    const mentions: any[] = msg.mentions ?? [];
    const mentionedMe = mentions.some((u: any) => u.id === me.id)
        || (msg.content ?? "").includes(`<@${me.id}>`);
    if (!mentionedMe) return;

    // Cooldown per sender
    const now = Date.now();
    const last = lastReplied.get(msg.author.id) ?? 0;
    const cooldown = settings.store.cooldownSeconds * 1000;
    if (cooldown > 0 && now - last < cooldown) return;
    lastReplied.set(msg.author.id, now);

    const replyText = settings.store.message.trim();
    if (!replyText) return;

    try {
        MessageActions.sendMessage(msg.channel_id, { content: replyText }, true, {
            messageReference: { channel_id: msg.channel_id, message_id: msg.id },
        });
    } catch {
        // fallback: no reply reference
        try { MessageActions.sendMessage(msg.channel_id, { content: replyText }); } catch {}
    }
}

function onKey(e: KeyboardEvent) {
    // Ctrl+Alt+A to toggle AFK mode
    if (!e.ctrlKey || !e.altKey || e.key !== "a") return;
    e.preventDefault();
    afkEnabled = !afkEnabled;
    const { Toasts } = require("@webpack/common");
    Toasts.show({
        id: Toasts.genId(),
        message: afkEnabled ? "AFK mode ON" : "AFK mode OFF",
        type: Toasts.Type.MESSAGE,
    });
}

export default definePlugin({
    name: "AfkResponder",
    description: "Press Ctrl+Alt+A to toggle AFK mode. While active, auto-replies to anyone who mentions you.",
    authors: [Devs._7n7],
    settings,

    start() {
        afkEnabled = false;
        lastReplied.clear();
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
        document.addEventListener("keydown", onKey, true);
    },

    stop() {
        afkEnabled = false;
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
        document.removeEventListener("keydown", onKey, true);
        lastReplied.clear();
    },
});

