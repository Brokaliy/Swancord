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

/**
 * AutoStatus — sets different Discord custom statuses based on time of day.
 *
 * Morning   (06:00–11:59): morning status
 * Afternoon (12:00–17:59): afternoon status
 * Evening   (18:00–22:59): evening status
 * Night     (23:00–05:59): night status
 */

const settings = definePluginSettings({
    morningStatus: {
        type: OptionType.STRING,
        description: "Status text for morning (06:00–11:59)",
        default: "good morning",
    },
    afternoonStatus: {
        type: OptionType.STRING,
        description: "Status text for afternoon (12:00–17:59)",
        default: "grinding",
    },
    eveningStatus: {
        type: OptionType.STRING,
        description: "Status text for evening (18:00–22:59)",
        default: "chilling",
    },
    nightStatus: {
        type: OptionType.STRING,
        description: "Status text for night (23:00–05:59)",
        default: "go to sleep",
    },
});

let timer: ReturnType<typeof setInterval> | null = null;

function getStatusForHour(h: number): string {
    const s = settings.store;
    if (h >= 6 && h < 12) return s.morningStatus;
    if (h >= 12 && h < 18) return s.afternoonStatus;
    if (h >= 18 && h < 23) return s.eveningStatus;
    return s.nightStatus;
}

function applyStatus() {
    const text = getStatusForHour(new Date().getHours()).trim();
    if (!text) return;

    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity: {
            type: 4,
            state: text,
            name: "Custom Status",
        },
        socketId: "AutoStatus",
    });
}

export default definePlugin({
    name: "AutoStatus",
    description: "Automatically sets your Discord status based on the time of day. Configure status texts in plugin settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        applyStatus();
        // Re-check every 5 minutes
        timer = setInterval(applyStatus, 5 * 60 * 1000);
    },

    stop() {
        if (timer) { clearInterval(timer); timer = null; }
        FluxDispatcher.dispatch({
            type: "LOCAL_ACTIVITY_UPDATE",
            activity: null,
            socketId: "AutoStatus",
        });
    },
});
