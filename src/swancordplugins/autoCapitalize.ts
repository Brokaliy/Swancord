/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    mode: {
        type: OptionType.SELECT,
        description: "What to capitalize",
        options: [
            { label: "First letter of message", value: "first", default: true },
            { label: "First letter of every sentence (. ! ?)", value: "sentences" },
        ],
    },
});

const URL_RE = /https?:\/\//i;

function capitalize(text: string, mode: string): string {
    if (!text.length) return text;
    if (mode === "sentences") {
        return text.replace(/(^|[.!?]\s+)(\S+)/g, (match, sep, word) =>
            URL_RE.test(word) ? match : sep + word.charAt(0).toUpperCase() + word.slice(1)
        );
    }
    // Don't capitalize if the message starts with a URL
    if (URL_RE.test(text)) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export default definePlugin({
    name: "AutoCapitalize",
    description: "Automatically capitalizes the first letter of your messages or every sentence.",
    authors: [Devs._7n7],
    dependencies: ["MessageEventsAPI"],
    settings,

    onBeforeMessageSend(_channelId: string, msg: any) {
        if (!msg.content) return;
        msg.content = capitalize(msg.content, settings.store.mode);
    },
});
