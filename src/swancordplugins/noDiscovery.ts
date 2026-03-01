/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-discovery";

const CSS = `
/* Explore Discoverable Servers button and Server Discovery sidebar items */
[class*="exploreButton_"],
[class*="discoverButton_"],
a[href="/guild-discovery"],
[data-list-item-id*="discover"],
[aria-label="Explore Discoverable Servers"],
[class*="browseChannels_"],
[class*="discoverabilityContainer_"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoDiscovery",
    description: 'Hides the "Explore Discoverable Servers" / Server Discovery button from the sidebar.',
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
