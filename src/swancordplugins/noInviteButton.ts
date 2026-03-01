/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-invite-button";

const CSS = `
/* "Invite People" button in member list header and + icon in DM list */
button[aria-label="Invite People"],
[class*="inviteButton_"],
[class*="addMemberButton_"],
[aria-label="Add Friends to DM"],
[class*="addButtonIcon_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoInviteButton",
    description: 'Hides the "Invite People" and "Add Friends to DM" buttons.',
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
