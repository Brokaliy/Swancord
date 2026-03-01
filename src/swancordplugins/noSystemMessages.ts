/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-system-messages";

const CSS = `
/* Join/leave messages, pin notifications, boost messages, call events */
[class*="systemMessage_"],
li[class*="messageListItem_"] [class*="isSystemMessage_"],
[class*="messageContent_"][class*="systemMessage_"],
[class*="joinedContent_"],
[class*="callContainer_"]:not([class*="callTileRoot_"]) {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoSystemMessages",
    description: "Hides system messages (member joins, pins, boosts, call events) from chat.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
