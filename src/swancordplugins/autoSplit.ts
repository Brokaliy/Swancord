/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, Toasts, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    maxLength: {
        type: OptionType.NUMBER,
        description: "Automatically split messages longer than this many characters (0 = disabled)",
        default: 1900,
    },
    separator: {
        type: OptionType.STRING,
        description: "Text appended to each chunk to signal continuation (e.g. \"...\")",
        default: "...",
    },
});

// Split a string at word boundaries near `limit`
function splitAtLimit(text: string, limit: number): string[] {
    const parts: string[] = [];
    let remaining = text;
    while (remaining.length > limit) {
        let splitIdx = remaining.lastIndexOf(" ", limit);
        if (splitIdx < limit * 0.6) splitIdx = limit; // no good space — hard cut
        parts.push(remaining.slice(0, splitIdx).trimEnd());
        remaining = remaining.slice(splitIdx).trimStart();
    }
    if (remaining.length) parts.push(remaining);
    return parts;
}

async function sendChunked(dispatchFn: (...args: any[]) => any, originalArgs: any[], content: string) {
    const limit   = settings.store.maxLength;
    const sep     = settings.store.separator;
    const chunks  = splitAtLimit(content, limit - sep.length);
    const [channelId, ...rest] = originalArgs;

    for (let i = 0; i < chunks.length; i++) {
        const text = i < chunks.length - 1 ? chunks[i] + sep : chunks[i];
        await dispatchFn(channelId, text, ...rest);
        if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 350));
    }
}

let originalSend: ((...args: any[]) => any) | null = null;

export default definePlugin({
    name: "AutoSplit",
    description: "Automatically splits messages that exceed Discord's character limit into sequential chunks.",
    authors: [Devs._7n7],
    settings,

    start() {
        // Patch the FluxDispatcher to intercept MESSAGE_SEND
        const origDispatch = FluxDispatcher.dispatch.bind(FluxDispatcher);
        (FluxDispatcher as any)._sc_origDispatch = origDispatch;

        FluxDispatcher.dispatch = async (action: any) => {
            if (
                action?.type === "SEND_MESSAGE" &&
                settings.store.maxLength > 0 &&
                action?.message?.content?.length > settings.store.maxLength
            ) {
                const content: string = action.message.content;
                const limit = settings.store.maxLength;
                const chunks = splitAtLimit(content, limit - settings.store.separator.length);
                if (chunks.length > 1) {
                    const sep = settings.store.separator;
                    for (let i = 0; i < chunks.length; i++) {
                        const text = i < chunks.length - 1 ? chunks[i] + sep : chunks[i];
                        await origDispatch({
                            ...action,
                            message: { ...action.message, content: text },
                        });
                        if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 350));
                    }
                    return;
                }
            }
            return origDispatch(action);
        };
    },

    stop() {
        const orig = (FluxDispatcher as any)._sc_origDispatch;
        if (orig) {
            FluxDispatcher.dispatch = orig;
            delete (FluxDispatcher as any)._sc_origDispatch;
        }
    },
});
