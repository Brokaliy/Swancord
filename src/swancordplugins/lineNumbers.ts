/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-line-numbers";
const ATTR = "data-sc-lined";

const CSS = `
pre[${ATTR}] {
    counter-reset: sc-line;
    padding-left: 3.5em !important;
    position: relative;
}
pre[${ATTR}] > code {
    display: block;
}
pre[${ATTR}] > code .sc-line {
    display: block;
    position: relative;
    padding-left: 0.2em;
}
pre[${ATTR}] > code .sc-line::before {
    counter-increment: sc-line;
    content: counter(sc-line);
    position: absolute;
    left: -2.8em;
    width: 2em;
    text-align: right;
    opacity: 0.35;
    font-size: 0.85em;
    user-select: none;
}
`;

function processBlock(pre: HTMLElement) {
    if (pre.hasAttribute(ATTR)) return;
    const code = pre.querySelector("code");
    if (!code) return;
    const lines = code.textContent?.split("\n") ?? [];
    if (lines.length < 2) return; // not worth it for single-line

    code.innerHTML = lines.map(l =>
        `<span class="sc-line">${l.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`
    ).join("");
    pre.setAttribute(ATTR, "1");
}

let observer: MutationObserver | null = null;

function processAll() {
    document.querySelectorAll<HTMLElement>("pre:not([" + ATTR + "])").forEach(processBlock);
}

export default definePlugin({
    name: "LineNumbers",
    description: "Adds line numbers to code blocks in chat.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);

        processAll();
        observer = new MutationObserver(processAll);
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        observer?.disconnect();
        observer = null;
        document.getElementById(STYLE_ID)?.remove();
        document.querySelectorAll<HTMLElement>("pre[" + ATTR + "]").forEach(pre => {
            pre.removeAttribute(ATTR);
            const code = pre.querySelector("code");
            if (code) code.innerHTML = code.textContent ?? "";
        });
    },
});
