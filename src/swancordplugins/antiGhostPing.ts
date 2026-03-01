/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

// Map of message_id → { author, content, channel_id }
const cache = new Map<string, { author: string; content: string; channelId: string; }>();
const MAX_CACHE = 500;

function prunCache() {
    if (cache.size > MAX_CACHE) {
        // delete oldest entries
        const keys = [...cache.keys()];
        for (let i = 0; i < keys.length - MAX_CACHE; i++) cache.delete(keys[i]);
    }
}

function mentionsMe(message: any): boolean {
    const me = UserStore.getCurrentUser();
    if (!me) return false;

    if (message.mention_everyone) return true;
    if (message.mentions?.some((u: any) => u.id === me.id)) return true;

    // role mentions – we can't reliably check without GuildMemberStore, so skip
    return false;
}

function onMessageCreate({ message }: any) {
    if (!mentionsMe(message)) return;

    cache.set(message.id, {
        author: message.author?.username ?? "Unknown",
        content: message.content ?? "",
        channelId: message.channel_id,
    });

    prunCache();
}

function onMessageDelete({ id }: { id: string; }) {
    const msg = cache.get(id);
    if (!msg) return;
    cache.delete(id);

    showNotification({
        title: `Ghost Ping — ${msg.author}`,
        body: msg.content || "(no text content)",
        color: "#f87171",
    });
}

export default definePlugin({
    name: "AntiGhostPing",
    description: "Shows a notification with the content of any message that pinged you and was then deleted.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
        FluxDispatcher.subscribe("MESSAGE_DELETE", onMessageDelete);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
        FluxDispatcher.unsubscribe("MESSAGE_DELETE", onMessageDelete);
        cache.clear();
    },
});
