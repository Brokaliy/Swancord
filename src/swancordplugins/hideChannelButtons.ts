/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
*/

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-hide-channel-buttons";

const CSS = `
/* "Add Channel" + button in channel category headers */
[class*="addButtonIcon"],
[aria-label="Add Channel"],
[aria-label="Create Channel"] {
    display: none !important;
}

/* "Invite People" button next to channel name in header */
[aria-label="Invite People"],
[class*="inviteButton"],
[class*="recipientInviteButton"] {
    display: none !important;
}

/* "Add Friends to DM" button */
[aria-label="Add Friends to DM"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "HideChannelButtons",
    description: "Hides the Add Channel and Invite People buttons from the sidebar to reduce clutter.",
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
