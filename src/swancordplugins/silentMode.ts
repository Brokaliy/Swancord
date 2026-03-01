/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";

// Intercept browser Notification API to suppress all desktop notifications
let originalNotification: typeof Notification | null = null;
let active = false;

class SilentNotification {
    constructor(_title: string, _options?: NotificationOptions) {
        // Swallowed — do nothing
    }
    static readonly permission = "granted" as NotificationPermission;
    static requestPermission() { return Promise.resolve("granted" as NotificationPermission); }
}

function toggle() {
    active = !active;
    if (active) {
        originalNotification = window.Notification;
        (window as any).Notification = SilentNotification;
        Toasts.show({ message: "Silent Mode ON — notifications suppressed", type: Toasts.Type.MESSAGE, id: Toasts.genId(), options: { duration: 2500 } });
    } else {
        if (originalNotification) (window as any).Notification = originalNotification;
        originalNotification = null;
        Toasts.show({ message: "Silent Mode OFF", type: Toasts.Type.MESSAGE, id: Toasts.genId(), options: { duration: 2000 } });
    }
}

function onKey(e: KeyboardEvent) {
    if (e.altKey && e.shiftKey && e.key === "M") {
        e.preventDefault();
        toggle();
    }
}

export default definePlugin({
    name: "SilentMode",
    description: "Press Alt+Shift+M to toggle silent mode — suppresses all desktop notifications until toggled off.",
    authors: [Devs._7n7],

    start() {
        active = false;
        document.addEventListener("keydown", onKey);
    },

    stop() {
        document.removeEventListener("keydown", onKey);
        // Restore notification if silenced
        if (active && originalNotification) {
            (window as any).Notification = originalNotification;
            originalNotification = null;
        }
        active = false;
    },
});
