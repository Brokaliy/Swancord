/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { FluxDispatcher, UserStore } from "@webpack/common";

const STYLE_ID = "swancord-no-onboarding";

// CSS: hide onboarding wizard overlays and welcome gates
const CSS = `
[class*="onboardingContainer_"],
[class*="onboardingWizard_"],
[class*="communityGuidelinesModal_"],
[class*="noticeContainer_"],
[data-list-id="onboarding-prompt"],
[class*="welcomeContainer_"] {
    display: none !important;
}
`;

function dismissOnboarding() {
    // Click through "I agree" / "Get started" buttons if present
    const selectors = [
        "[class*=\"getStartedButton_\"]",
        "[class*=\"onboardingCompleteButton_\"]",
        "button[class*=\"channelNoticeButton_\"]",
    ];
    for (const sel of selectors) {
        const btn = document.querySelector<HTMLElement>(sel);
        if (btn) btn.click();
    }
}

function onGuildJoin() {
    setTimeout(dismissOnboarding, 500);
    setTimeout(dismissOnboarding, 1500);
}

export default definePlugin({
    name: "NoOnboarding",
    description: "Automatically dismisses server onboarding, welcome gates, and community guideline overlays.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
        FluxDispatcher.subscribe("GUILD_MEMBER_ADD", onGuildJoin);
        FluxDispatcher.subscribe("CHANNEL_SELECT",   onGuildJoin);
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
        FluxDispatcher.unsubscribe("GUILD_MEMBER_ADD", onGuildJoin);
        FluxDispatcher.unsubscribe("CHANNEL_SELECT",   onGuildJoin);
    },
});
