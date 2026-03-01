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

// Block the typing start action so others never see "X is typing..."
const TypingActions = findByPropsLazy("startTyping", "stopTyping");

let originalStart: ((...args: any[]) => any) | null = null;

export default definePlugin({
    name: "NoTypingIndicator",
    description: "Prevents Discord from sending typing indicators — others won't see you typing.",
    authors: [Devs._7n7],

    start() {
        if (TypingActions && typeof TypingActions.startTyping === "function") {
            originalStart = TypingActions.startTyping;
            TypingActions.startTyping = () => { /* no-op */ };
        }
    },

    stop() {
        if (TypingActions && originalStart) {
            TypingActions.startTyping = originalStart;
            originalStart = null;
        }
    },
});
