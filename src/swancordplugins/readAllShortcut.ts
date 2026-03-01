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

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

// Mark ALL channels/servers as read with a single keyboard shortcut
const GuildActions = findByPropsLazy("markGuildAsRead", "markChannelAsRead");
const SortedGuildStore = findByPropsLazy("getSortedGuilds", "getGuildFolders");

function markAllRead() {
    const guilds = SortedGuildStore.getSortedGuilds?.() ?? [];
    for (const guild of guilds) {
        const id = guild?.id ?? guild;
        if (id) GuildActions.markGuildAsRead(id);
    }
}

function onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === "A") {
        // Avoid interfering with Select-All
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        markAllRead();
    }
}

export default definePlugin({
    name: "ReadAllShortcut",
    description: "Press Ctrl+Shift+A to mark all servers and channels as read.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
    },
});
