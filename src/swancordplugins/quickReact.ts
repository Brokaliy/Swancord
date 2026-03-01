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

const ReactionActions = findByPropsLazy("addReaction", "removeReaction");
const MessageStore = findByPropsLazy("getMessage", "getMessages");
const SelectedChannelStore = findByPropsLazy("getChannelId", "getVoiceChannelId");

// Quick-react with keyboard shortcut: hover over a message, then press Alt+<number> 1-5
// to add one of the preset quick-react emojis.
const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "✅"];

function onKeyDown(e: KeyboardEvent) {
    if (!e.altKey) return;
    const idx = parseInt(e.key) - 1;
    if (idx < 0 || idx >= QUICK_EMOJIS.length) return;

    const emoji = QUICK_EMOJIS[idx];
    const channelId = SelectedChannelStore.getChannelId?.();
    if (!channelId) return;

    // Find the message the user is hovering over
    const hovered = document.querySelector<HTMLElement>("[class*='message_']:hover, [class*='messageListItem']:hover");
    if (!hovered) return;

    const messageId = hovered.id?.replace("chat-messages-", "").split("-").pop()
        ?? hovered.getAttribute("data-list-item-id")?.split("___").pop();
    if (!messageId) return;

    e.preventDefault();
    ReactionActions.addReaction(channelId, messageId, { id: null, name: emoji, animated: false });
}

export default definePlugin({
    name: "QuickReact",
    description: "Hover over any message and press Alt+1 through Alt+5 to instantly react with 👍 ❤️ 😂 🔥 ✅.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("keydown", onKeyDown);
    },

    stop() {
        document.removeEventListener("keydown", onKeyDown);
    },
});
