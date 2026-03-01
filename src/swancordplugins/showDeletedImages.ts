/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

// Cache attachment URLs before messages are deleted
const attachmentCache = new Map<string, string[]>(); // messageId → urls

function onMessageCreate(e: any) {
    const msg = e?.message;
    if (!msg?.id) return;
    const urls: string[] = [];
    for (const att of msg.attachments ?? []) {
        if (att.url) urls.push(att.url);
    }
    for (const embed of msg.embeds ?? []) {
        if (embed.image?.url) urls.push(embed.image.url);
        if (embed.thumbnail?.url) urls.push(embed.thumbnail.url);
    }
    if (urls.length) attachmentCache.set(msg.id, urls);
    if (attachmentCache.size > 1000) {
        const first = attachmentCache.keys().next().value;
        attachmentCache.delete(first);
    }
}

const STYLE_ID = "swancord-show-deleted-imgs";

export default definePlugin({
    name: "ShowDeletedImages",
    description: "Caches image URLs from messages before they are deleted. Check the browser console (Ctrl+Shift+I) for cached URLs of deleted attachments.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);

        // Expose cache to devtools for easy access
        (window as any).__scDeletedImages = attachmentCache;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
        delete (window as any).__scDeletedImages;
        document.getElementById(STYLE_ID)?.remove();
        attachmentCache.clear();
    },
});
