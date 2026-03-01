/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-no-role-colors";

export default definePlugin({
    name: "NoRoleColors",
    description: "Removes role-based username colors in chat and member list — everyone shows in the default text color.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            [class*="username_"],
            [class*="roleColor_"],
            [class*="coloredText_"],
            [class*="member_"] [class*="nick_"] { color: var(--text-normal) !important; }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
