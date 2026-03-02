/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-linked-roles";

const CSS = `
/* Linked Roles section in user / server profiles */
[class*="linkedRoles_"],
[class*="linkedRole_"],
[class*="roleConnectionsSection_"],
[class*="roleConnections_"],
[aria-label*="Linked Role"],
[class*="connection_"][class*="role"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoLinkedRoles",
    description: "Hides the Linked Roles section from user profiles and server member popouts.",
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
