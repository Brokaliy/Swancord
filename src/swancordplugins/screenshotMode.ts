/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";

const STYLE_ID = "swancord-screenshot-mode";

// IDs are stable; class name wildcards match Discord's CSS-module hashed names.
// Covers: message authors, avatars, DM list, member list, server list tooltips,
// channel names, server name, own account panel, status/presence, role names.
const BLUR_CSS = `
/* ── Message author names ── */
[id^="message-username-"],
[class*="username_"],
/* ── All avatars ── */
[class*="avatar_"] img,
[class*="avatarWrapper_"] img,
/* ── DM sidebar ── */
[class*="nameAndDecorators_"] [class*="name_"],
[class*="privateChannelsHeaderContainer_"] ~ * [class*="name_"],
/* ── Member list ── */
[class*="memberUsername_"],
[class*="member_"] [class*="name_"],
/* ── Server / guild name in header ── */
[class*="guildName_"],
[class*="titleWrapper_"] [class*="title_"],
/* ── Channel names ── */
[class*="name_"][class*="channel_"],
[class*="channelName_"],
/* ── Own account panel (bottom-left) ── */
[class*="nameTag_"],
/* ── Status / presence text ── */
[class*="customStatus_"],
[class*="activityText_"],
[class*="statusText_"],
/* ── Role names ── */
[class*="roleName_"],
/* ── Reaction user tooltips ── */
[class*="reactionTooltip_"] {
    filter: blur(7px) !important;
    user-select: none !important;
    transition: filter 0.2s;
}
[class*="avatar_"] img:hover,
[class*="avatarWrapper_"] img:hover,
[id^="message-username-"]:hover,
[class*="username_"]:hover {
    filter: blur(3px) !important;
}
`;

let active = false;

function toggle() {
    active = !active;
    if (active) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = BLUR_CSS;
        document.head.appendChild(style);
    } else {
        document.getElementById(STYLE_ID)?.remove();
    }
    Toasts.show({
        id: Toasts.genId(),
        message: active ? "Screenshot mode ON (Ctrl+Alt+S to disable)" : "Screenshot mode OFF",
        type: Toasts.Type.MESSAGE,
    });
}

function onKey(e: KeyboardEvent) {
    if (e.ctrlKey && e.altKey && e.key === "s") {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "ScreenshotMode",
    description: "Press Ctrl+Alt+S to blur all usernames and avatars for taking clean screenshots.",
    authors: [Devs._7n7],

    start() {
        active = false;
        document.addEventListener("keydown", onKey, true);
    },

    stop() {
        document.removeEventListener("keydown", onKey, true);
        document.getElementById(STYLE_ID)?.remove();
        active = false;
    },
});
