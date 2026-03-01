/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-wave";

export default definePlugin({
    name: "NoWave",
    description: "Hides the \"wave to say hi\" prompt shown in empty DM conversations.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="waveContainer_"],
            [class*="emptyConversation_"] [class*="waveButton"],
            [class*="newChatContent_"] [class*="iconWrapper_"] { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
