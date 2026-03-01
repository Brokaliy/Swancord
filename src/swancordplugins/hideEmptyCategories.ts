/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Hides channel category headers when every channel under them is hidden/inaccessible.
// Uses a periodic DOM scan rather than a MutationObserver to avoid rendering interference.

let poll: ReturnType<typeof setInterval> | null = null;

function scan() {
    // Category containers (the <li> that wraps a header + its channel list)
    const categories = document.querySelectorAll<HTMLElement>("[class*='containerDefault_'][class*='hoverable_']");
    categories.forEach(cat => {
        // Look for sibling channel items at the same nesting level
        const parent = cat.closest("li, [class*='category_']") ?? cat.parentElement;
        if (!parent) return;

        // A category's channels are the following siblings until the next category
        const container = parent.parentElement;
        if (!container) return;

        const items = Array.from(container.children);
        const idx = items.indexOf(parent);
        let hasVisible = false;
        for (let i = idx + 1; i < items.length; i++) {
            const el = items[i] as HTMLElement;
            // Stop at the next category
            if (el.querySelector("[class*='containerDefault_'][class*='hoverable_']")) break;
            const ch = el.querySelector<HTMLElement>("[class*='linkTop_'], [class*='channel_']");
            if (ch && ch.offsetParent !== null) { hasVisible = true; break; }
        }
        (parent as HTMLElement).style.display = hasVisible ? "" : "none";
    });
}

export default definePlugin({
    name: "HideEmptyCategories",
    description: "Hides channel categories that have no visible channels (all locked, hidden, or muted).",
    authors: [Devs._7n7],

    start() {
        poll = setInterval(scan, 2000);
        scan();
    },

    stop() {
        if (poll) { clearInterval(poll); poll = null; }
        // Restore any hidden categories
        document.querySelectorAll<HTMLElement>("[class*='containerDefault_'][class*='hoverable_']").forEach(cat => {
            const parent = cat.closest("li, [class*='category_']") ?? cat.parentElement;
            if (parent) (parent as HTMLElement).style.display = "";
        });
    },
});
