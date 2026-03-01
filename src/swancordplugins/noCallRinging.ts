/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-call-ringing";

export default definePlugin({
    name: "NoCallRinging",
    description: "Removes the pulsing ring animation on incoming call notifications.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="ring_"],
            [class*="ripple_"][class*="call"],
            [class*="pulse_"],
            [class*="callContainer_"] [class*="ripple"],
            [class*="incomingCall_"] [class*="ring"] { animation: none !important; transition: none !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
