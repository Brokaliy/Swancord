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
import { FluxDispatcher } from "@webpack/common";

const settings = definePluginSettings({
    statuses: {
        type: OptionType.STRING,
        description: "Status texts to rotate through, separated by | (pipe). Example: working hard | not really | send help",
        default: "working hard | not really | send help",
    },
    intervalSecs: {
        type: OptionType.NUMBER,
        description: "Seconds between status changes",
        default: 30,
    },
    emoji: {
        type: OptionType.STRING,
        description: "Optional emoji name to show with status (leave blank for none)",
        default: "",
    },
});

let timer: ReturnType<typeof setInterval> | null = null;
let index = 0;

function getStatuses(): string[] {
    return settings.store.statuses
        .split("|")
        .map(s => s.trim())
        .filter(Boolean);
}

function setStatus(text: string) {
    const emoji = settings.store.emoji.trim();
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: {
            type: 4, // CUSTOM_STATUS
            state: text,
            name: "Custom Status",
            ...(emoji ? { emoji: { name: emoji } } : {}),
        },
        socketId: "StatusRotator",
    });
}

function clearStatus() {
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: null,
        socketId: "StatusRotator",
    });
}

function tick() {
    const statuses = getStatuses();
    if (!statuses.length) return;
    setStatus(statuses[index % statuses.length]);
    index++;
}

export default definePlugin({
    name: "StatusRotator",
    description: "Rotates through a list of custom statuses on a timer. Configure your statuses in the plugin settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        index = 0;
        tick();
        timer = setInterval(tick, (settings.store.intervalSecs || 30) * 1000);
    },

    stop() {
        if (timer) { clearInterval(timer); timer = null; }
        clearStatus();
    },
});
