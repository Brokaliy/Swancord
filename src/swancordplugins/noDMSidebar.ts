/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-dm-sidebar";

const CSS = `
/* Home / DMs button and the entire DMs section in the sidebar */
[class*="listItem_"] a[href="/channels/@me"],
[aria-label="Direct Messages"],
[data-list-item-id="guildsnav___home"],
[class*="privateChannels_"],
[class*="privateChannelRecipientsInviteArea_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoDMSidebar",
    description: "Hides the Home / Direct Messages section from the sidebar — ideal for server-only usage.",
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
