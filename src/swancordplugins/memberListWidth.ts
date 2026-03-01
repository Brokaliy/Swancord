/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-member-list-width";

const settings = definePluginSettings({
    width: {
        type: OptionType.NUMBER,
        description: "Member list panel width in pixels (default: 240)",
        default: 240,
    },
});

export default definePlugin({
    name: "MemberListWidth",
    description: "Set a custom width for the server member list panel.",
    authors: [Devs._7n7],
    settings,

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        const w = settings.store.width || 240;
        style.textContent = `
            [class*="members_"],
            [class*="membersWrap_"] {
                width: ${w}px !important;
                min-width: ${w}px !important;
                max-width: ${w}px !important;
            }
        `;
        document.head.appendChild(style);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
