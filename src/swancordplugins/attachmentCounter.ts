/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

// Tracks the number of files/attachments you've uploaded this session
// and reflects the count in the window title.

let attachmentCount = 0;
let originalTitle = "";

function updateTitle() {
    if (!originalTitle) return;
    if (attachmentCount === 0) {
        document.title = originalTitle;
    } else {
        // Strip any existing badge before re-adding
        const base = originalTitle.replace(/^\[\d+ files?\] /, "");
        document.title = `[${attachmentCount} file${attachmentCount === 1 ? "" : "s"}] ${base}`;
    }
}

function onMessageCreate(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me) return;
    const msg = event?.message;
    if (msg?.author?.id !== me.id) return;
    const count = (msg.attachments?.length ?? 0) + (msg.embeds?.filter((e: any) => e.type === "image")?.length ?? 0);
    if (count > 0) {
        attachmentCount += count;
        updateTitle();
    }
}

export default definePlugin({
    name: "AttachmentCounter",
    description: "Tracks how many files/attachments you've uploaded this session and shows the count in the window title.",
    authors: [Devs._7n7],

    start() {
        originalTitle = document.title;
        attachmentCount = 0;
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
        document.title = originalTitle;
        originalTitle = "";
        attachmentCount = 0;
    },
});
