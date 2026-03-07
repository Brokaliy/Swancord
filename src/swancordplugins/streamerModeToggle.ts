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
import { sendMessage } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Toasts } from "@webpack/common";

const StreamerModeStore = findByPropsLazy("hidePersonalInformation", "enabled");
const StreamerModeActions = findByPropsLazy("setEnabled", "setHidePersonalInformation");

const settings = definePluginSettings({
    shortcut: {
        type: OptionType.STRING,
        description: "Keyboard shortcut to toggle streamer mode. Format: Modifier+Key (e.g. Alt+S, Shift+Alt+S). Case-insensitive key.",
        default: "Alt+S",
    },
    showToast: {
        type: OptionType.BOOLEAN,
        description: "Show a toast notification when streamer mode is toggled",
        default: true,
    },
});

function parseShortcut(raw: string): { mods: Set<string>; key: string; } | null {
    const parts = raw.trim().split("+").map(p => p.trim().toLowerCase());
    if (parts.length < 1) return null;
    const key = parts[parts.length - 1];
    const mods = new Set(parts.slice(0, -1));
    return { mods, key };
}

function matchesShortcut(e: KeyboardEvent): boolean {
    const parsed = parseShortcut(settings.store.shortcut || "Alt+S");
    if (!parsed) return false;

    const { mods, key } = parsed;
    if (e.key.toLowerCase() !== key) return false;
    if (mods.has("ctrl")  !== e.ctrlKey)  return false;
    if (mods.has("alt")   !== e.altKey)   return false;
    if (mods.has("shift") !== e.shiftKey) return false;
    if (mods.has("meta")  !== e.metaKey)  return false;
    return true;
}

function toggle() {
    const current = StreamerModeStore?.enabled ?? false;
    StreamerModeActions?.setEnabled(!current);

    if (settings.store.showToast) {
        Toasts.show({
            message: !current ? "Streamer Mode enabled" : "Streamer Mode disabled",
            type: !current ? Toasts.Type.SUCCESS : Toasts.Type.MESSAGE,
            id: Toasts.genId(),
        });
    }
}

function onKeyDown(e: KeyboardEvent) {
    // Don't fire while typing in an input
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if ((e.target as HTMLElement)?.isContentEditable) return;

    if (matchesShortcut(e)) {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "StreamerModeToggle",
    description: "Toggle Discord's streamer mode instantly with a configurable keyboard shortcut (default: Alt+S). Can also be clicked via the shortcut while in chat.",
    authors: [Devs._7n7],
    settings,

    start() {
        document.addEventListener("keydown", onKeyDown, true);
    },

    stop() {
        document.removeEventListener("keydown", onKeyDown, true);
    },
});
