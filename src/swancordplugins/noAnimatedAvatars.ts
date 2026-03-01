/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// Replaces animated avatar GIFs with their static .webp counterpart (removes /a_ prefix hack)
// Works by observing the DOM for new <img> tags that have animated CDN avatar URLs.

const CDN_RE = /https:\/\/cdn\.discordapp\.com\/avatars\/(\d+)\/(a_[a-f0-9]+)\.(gif|webp|png)(\?.*)?/;

function freezeImg(img: HTMLImageElement) {
    const src = img.getAttribute("src") ?? "";
    const m = CDN_RE.exec(src);
    if (!m) return;
    // Replace with static .webp — Discord will serve a still frame
    const staticSrc = `https://cdn.discordapp.com/avatars/${m[1]}/${m[2]}.webp?size=128`;
    if (src !== staticSrc) img.setAttribute("src", staticSrc);
}

function freezeAll() {
    document.querySelectorAll<HTMLImageElement>("img").forEach(freezeImg);
}

let observer: MutationObserver | null = null;

export default definePlugin({
    name: "NoAnimatedAvatars",
    description: "Freezes animated profile picture GIFs and shows a static frame instead.",
    authors: [Devs._7n7],

    start() {
        freezeAll();
        observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                m.addedNodes.forEach(node => {
                    if (node instanceof HTMLImageElement) freezeImg(node);
                    else if (node instanceof HTMLElement) {
                        node.querySelectorAll<HTMLImageElement>("img").forEach(freezeImg);
                    }
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        observer?.disconnect();
        observer = null;
        // Restore requires a page reload — just disconnect and let Discord re-render normally
    },
});
