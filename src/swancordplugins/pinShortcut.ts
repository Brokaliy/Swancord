/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { ChannelStore, FluxDispatcher, RestAPI, SelectedChannelStore, Toasts } from "@webpack/common";

// Track the last message that was right-clicked
let lastCtxChannelId: string | null = null;
let lastCtxMessageId: string | null = null;

function onContextMenu(e: MouseEvent) {
    // Walk up from the click target to find a message container
    const el = (e.target as Element).closest("[id^=\"message-content-\"], [class*=\"message_\"]");
    if (!el) return;
    const msgId = el.id?.replace("message-content-", "") ?? el.getAttribute("data-message-id");
    if (!msgId) return;
    const channelId = SelectedChannelStore.getChannelId();
    if (!channelId) return;
    lastCtxMessageId = msgId;
    lastCtxChannelId = channelId;
}

async function onKey(e: KeyboardEvent) {
    // Ctrl+Shift+P to pin last right-clicked message
    if (!e.ctrlKey || !e.shiftKey || e.key !== "P") return;
    if (!lastCtxMessageId || !lastCtxChannelId) {
        Toasts.show({ id: Toasts.genId(), message: "Right-click a message first.", type: Toasts.Type.FAILURE });
        return;
    }
    e.preventDefault();
    const channelId = lastCtxChannelId;
    const messageId = lastCtxMessageId;
    try {
        // Check if already pinned
        const pinsRes = await RestAPI.get({ url: `/channels/${channelId}/pins` });
        const pins: any[] = pinsRes.body ?? [];
        const isPinned = pins.some((p: any) => p.id === messageId);
        if (isPinned) {
            await RestAPI.del({ url: `/channels/${channelId}/pins/${messageId}` });
            Toasts.show({ id: Toasts.genId(), message: "Message unpinned.", type: Toasts.Type.SUCCESS });
        } else {
            await RestAPI.put({ url: `/channels/${channelId}/pins/${messageId}` });
            Toasts.show({ id: Toasts.genId(), message: "Message pinned.", type: Toasts.Type.SUCCESS });
        }
    } catch (err: any) {
        showNotification({ title: "Pin Failed", body: err?.body?.message ?? "Missing Manage Messages permission.", color: "#f04747" });
    }
}

export default definePlugin({
    name: "PinShortcut",
    description: "Right-click any message, then press Ctrl+Shift+P to instantly pin/unpin it — no modal.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("contextmenu", onContextMenu, true);
        document.addEventListener("keydown", onKey, true);
    },

    stop() {
        document.removeEventListener("contextmenu", onContextMenu, true);
        document.removeEventListener("keydown", onKey, true);
        lastCtxChannelId = null;
        lastCtxMessageId = null;
    },
});
