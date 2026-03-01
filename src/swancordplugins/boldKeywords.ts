/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    keywords: {
        type: OptionType.STRING,
        description: "Comma-separated words to auto-bold in every message you send",
        default: "",
    },
    caseSensitive: {
        type: OptionType.BOOLEAN,
        description: "Case-sensitive keyword matching",
        default: false,
    },
});

function boldKeywords(content: string): string {
    const raw = settings.store.keywords;
    if (!raw.trim()) return content;

    const words = raw.split(",").map(w => w.trim()).filter(Boolean);
    let result = content;

    for (const word of words) {
        const flags = settings.store.caseSensitive ? "g" : "gi";
        const re = new RegExp(`(?<!\\*)\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b(?!\\*)`, flags);
        result = result.replace(re, "**$1**");
    }
    return result;
}

export default definePlugin({
    name: "BoldKeywords",
    description: "Automatically bolds configured keywords in every message you send.",
    authors: [Devs._7n7],
    dependencies: ["MessageEventsAPI"],
    settings,

    onBeforeMessageSend(_channelId: string, msg: any) {
        if (!msg.content) return;
        msg.content = boldKeywords(msg.content);
    },
});
