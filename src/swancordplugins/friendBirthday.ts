/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Toasts } from "@webpack/common";

const settings = definePluginSettings({
    birthdays: {
        type: OptionType.STRING,
        description: "Birthdays list — one per line, format: Name=MM-DD  (e.g. Alice=03-15)",
        default: "",
    },
    reminderDaysBefore: {
        type: OptionType.NUMBER,
        description: "Also show a reminder this many days before the birthday (0 = only on the day)",
        default: 1,
    },
});

function parseBirthdays(raw: string): Array<{ name: string; month: number; day: number; }> {
    return raw.split("\n").flatMap(line => {
        const [name, date] = line.split("=").map(s => s.trim());
        if (!name || !date) return [];
        const [mm, dd] = date.split("-").map(Number);
        if (!mm || !dd || mm < 1 || mm > 12 || dd < 1 || dd > 31) return [];
        return [{ name, month: mm, day: dd }];
    });
}

function checkBirthdays() {
    const now = new Date();
    const todayM = now.getMonth() + 1;
    const todayD = now.getDate();
    const ahead = Math.max(0, settings.store.reminderDaysBefore);

    parseBirthdays(settings.store.birthdays).forEach(({ name, month, day }) => {
        // Check today
        if (month === todayM && day === todayD) {
            Toasts.show({
                message: `🎂 Today is ${name}'s birthday!`,
                type: Toasts.Type.MESSAGE,
                id: Toasts.genId(),
                options: { duration: 8000 },
            });
            return;
        }
        // Check "ahead" days before
        if (ahead > 0) {
            const bday = new Date(now.getFullYear(), month - 1, day);
            const diffMs = bday.getTime() - now.setHours(0, 0, 0, 0);
            const diffDays = Math.round(diffMs / 86_400_000);
            if (diffDays === ahead) {
                Toasts.show({
                    message: `🎁 ${name}'s birthday is in ${ahead} day${ahead === 1 ? "" : "s"}!`,
                    type: Toasts.Type.MESSAGE,
                    id: Toasts.genId(),
                    options: { duration: 6000 },
                });
            }
        }
    });
}

export default definePlugin({
    name: "FriendBirthday",
    description: "Stores friend birthdays locally and shows a reminder toast on (or before) the day.",
    authors: [Devs._7n7],
    settings,

    start() {
        checkBirthdays();
    },

    stop() { },
});
