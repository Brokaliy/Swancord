/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-status-dot";

export default definePlugin({
    name: "NoStatusDot",
    description: "Hides the online/idle/DND/offline status dot on all avatars.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="status_"][class*="online"],
            [class*="status_"][class*="idle"],
            [class*="status_"][class*="dnd"],
            [class*="status_"][class*="offline"],
            [class*="status_"][class*="streaming"],
            [class*="status_"][class*="unknown"],
            foreignObject[class*="status_"],
            rect[class*="status_"],
            mask[class*="status_"] ~ rect { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
