/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, RestAPI, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    delay: {
        type: OptionType.NUMBER,
        description: "Seconds to show the Undo button after sending (1–10)",
        default: 5,
    },
});

const STYLE_ID = "swancord-undo-send";
const CSS = `
#swancord-undo-bar {
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--background-floating, #18191c);
    color: var(--text-normal, #dcddde);
    border: 1px solid var(--background-modifier-accent, #4f545c);
    border-radius: 8px;
    padding: 8px 18px;
    display: flex;
    align-items: center;
    gap: 14px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    animation: swancord-undo-in 0.18s ease;
}
@keyframes swancord-undo-in {
    from { opacity: 0; transform: translateX(-50%) translateY(12px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
#swancord-undo-bar button {
    background: #ed4245;
    color: #fff;
    border: none;
    border-radius: 5px;
    padding: 4px 12px;
    cursor: pointer;
    font-weight: 600;
    font-size: 13px;
}
#swancord-undo-bar button:hover { background: #c03537; }
`;

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBar: HTMLElement | null = null;

function clearPending() {
    if (pendingTimer) { clearTimeout(pendingTimer); pendingTimer = null; }
    pendingBar?.remove();
    pendingBar = null;
}

function showUndoBar(channelId: string, messageId: string) {
    clearPending();

    const bar = document.createElement("div");
    bar.id = "swancord-undo-bar";
    bar.innerHTML = `<span>Message sent</span><button>Undo</button>`;
    document.body.appendChild(bar);
    pendingBar = bar;

    bar.querySelector("button")!.addEventListener("click", () => {
        RestAPI.del({ url: `/channels/${channelId}/messages/${messageId}` }).catch(() => { });
        clearPending();
    });

    const secs = Math.max(1, Math.min(settings.store.delay, 10));
    pendingTimer = setTimeout(clearPending, secs * 1000);
}

function onMessageCreate(event: any) {
    const me = UserStore.getCurrentUser?.();
    if (!me) return;
    const msg = event?.message;
    if (!msg || msg.author?.id !== me.id) return;
    // Only own messages in the current session (has nonce = just sent)
    if (!msg.nonce) return;
    showUndoBar(msg.channel_id, msg.id);
}

export default definePlugin({
    name: "UndoSend",
    description: "Shows an Undo button for a few seconds after sending a message. Click it to auto-delete.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
        clearPending();
        document.getElementById(STYLE_ID)?.remove();
    },
});
