/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";

const settings = definePluginSettings({
    rules: {
        type: OptionType.STRING,
        description: "Replacement rules separated by | (pipe). Format: word=replacement. Example: gm=good morning | gg=good game | ngl=not gonna lie",
        default: "gm=good morning | gg=good game | ngl=not gonna lie",
    },
});

function getRules(): [RegExp, string][] {
    return settings.store.rules
        .split("|")
        .map(l => l.trim())
        .filter(l => l.includes("="))
        .map(l => {
            const idx = l.indexOf("=");
            const find = l.slice(0, idx).trim();
            const replace = l.slice(idx + 1).trim();
            try {
                return [new RegExp(`\\b${find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), replace] as [RegExp, string];
            } catch {
                return null;
            }
        })
        .filter((r): r is [RegExp, string] => r !== null);
}

const MessageActions = findByPropsLazy("sendMessage", "editMessage");
const _originalSend = new WeakMap<object, typeof MessageActions["sendMessage"]>();

export default definePlugin({
    name: "WordReplace",
    description: "Automatically replaces words/phrases in messages you send. Configure rules in plugin settings.",
    authors: [Devs._7n7],
    settings,

    patches: [
        {
            find: '"MessageActionCreators"',
            replacement: {
                match: /sendMessage\((\i),(\i),/,
                replace: "sendMessage($1,$self.processMessage($2),",
            },
            noWarn: true,
        },
    ],

    processMessage(message: { content: string; }) {
        if (!message?.content) return message;
        let { content } = message;
        for (const [regex, replacement] of getRules()) {
            content = content.replace(regex, replacement);
        }
        return { ...message, content };
    },
});
