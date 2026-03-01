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

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore, FluxDispatcher, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    channelIds: {
        type: OptionType.STRING,
        description: "Comma-separated channel IDs to watch for new messages",
        default: "",
    },
});

function getWatchedIds(): Set<string> {
    return new Set(
        settings.store.channelIds
            .split(",")
            .map(s => s.trim())
            .filter(Boolean)
    );
}

function onMessage(event: any) {
    const msg = event?.message;
    if (!msg) return;
    const me = UserStore.getCurrentUser?.();
    if (msg.author?.id === me?.id) return; // ignore own messages

    const watched = getWatchedIds();
    if (!watched.has(msg.channel_id)) return;

    const channel = ChannelStore.getChannel?.(msg.channel_id);
    const channelName = channel?.name ?? msg.channel_id;
    const author = msg.author?.username ?? "Someone";
    const content = msg.content?.slice(0, 80) || "[media]";

    new Notification(`#${channelName}`, {
        body: `${author}: ${content}`,
        silent: false,
    });
}

export default definePlugin({
    name: "ChannelNotify",
    description: "Sends a desktop notification whenever a message is posted in specific channels you're watching. Add channel IDs in settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
    },
});
