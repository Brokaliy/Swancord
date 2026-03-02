/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher, Toasts } from "@webpack/common";

const settings = definePluginSettings({
    startTime: {
        type: OptionType.STRING,
        description: "Local time to automatically enable DND (24h HH:MM, e.g. 22:00)",
        default: "22:00",
    },
    endTime: {
        type: OptionType.STRING,
        description: "Local time to automatically disable DND and restore online (24h HH:MM, e.g. 08:00)",
        default: "08:00",
    },
    notifyOnChange: {
        type: OptionType.BOOLEAN,
        description: "Show a toast notification when status is automatically switched",
        default: true,
    },
});

function parseTime(t: string): { h: number; m: number; } {
    const parts = t.split(":").map(Number);
    return { h: parts[0] ?? 0, m: parts[1] ?? 0 };
}

function toMinutes(h: number, m: number): number {
    return h * 60 + m;
}

function nowMinutes(): number {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
}

let interval: ReturnType<typeof setInterval> | null = null;
let lastStatus: "dnd" | "online" | null = null;

function setStatus(status: "dnd" | "online") {
    if (lastStatus === status) return;
    lastStatus = status;
    FluxDispatcher.dispatch({
        type: "USER_SETTINGS_PROTO_OVERWRITE_UPDATE",
        settings: { status },
    });
    if (settings.store.notifyOnChange) {
        Toasts.show({
            message: status === "dnd" ? "🌙 DND schedule: Do Not Disturb enabled" : "☀️ DND schedule: Online restored",
            type: Toasts.Type.MESSAGE,
            id: Toasts.genId(),
            options: { duration: 3500 },
        });
    }
}

function tick() {
    const now = nowMinutes();
    const start = parseTime(settings.store.startTime);
    const end = parseTime(settings.store.endTime);
    const startMin = toMinutes(start.h, start.m);
    const endMin = toMinutes(end.h, end.m);

    let inDndRange: boolean;
    if (startMin <= endMin) {
        // Same-day range e.g. 09:00–17:00
        inDndRange = now >= startMin && now < endMin;
    } else {
        // Overnight range e.g. 22:00–08:00
        inDndRange = now >= startMin || now < endMin;
    }

    setStatus(inDndRange ? "dnd" : "online");
}

export default definePlugin({
    name: "DndSchedule",
    description: "Automatically enables and disables Do Not Disturb status on a daily time schedule.",
    authors: [Devs._7n7],
    settings,

    start() {
        tick();
        interval = setInterval(tick, 60_000); // check every minute
    },

    stop() {
        if (interval) { clearInterval(interval); interval = null; }
        lastStatus = null;
    },
});
