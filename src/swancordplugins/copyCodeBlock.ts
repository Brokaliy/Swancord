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

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const STYLE_ID = "swancord-copy-code-block";

const BUTTON_CSS = `
.sc-copy-btn {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 3px 8px;
    font-size: 0.72rem;
    font-family: var(--font-code);
    color: rgba(255,255,255,0.55);
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    z-index: 1;
    line-height: 1.4;
    user-select: none;
}
.sc-copy-btn:hover {
    background: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.85);
}
.sc-copy-btn.sc-copied {
    color: #4ade80;
    border-color: rgba(74,222,128,0.30);
    background: rgba(74,222,128,0.08);
}
pre { position: relative; }
`;

function addCopyButton(pre: HTMLElement) {
    if (pre.querySelector(".sc-copy-btn")) return;

    const btn = document.createElement("button");
    btn.className = "sc-copy-btn";
    btn.textContent = "copy";

    btn.addEventListener("click", () => {
        const code = pre.querySelector("code");
        if (!code) return;
        navigator.clipboard.writeText(code.innerText ?? "").then(() => {
            btn.textContent = "copied!";
            btn.classList.add("sc-copied");
            setTimeout(() => {
                btn.textContent = "copy";
                btn.classList.remove("sc-copied");
            }, 1500);
        });
    });

    pre.appendChild(btn);
}

function processAll() {
    document.querySelectorAll<HTMLElement>("pre").forEach(addCopyButton);
}

let observer: MutationObserver | null = null;

export default definePlugin({
    name: "CopyCodeBlock",
    description: "Adds a one-click copy button to every code block in chat.",
    authors: [Devs._7n7],

    start() {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = BUTTON_CSS;
        document.head.appendChild(style);

        processAll();

        observer = new MutationObserver(() => processAll());
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        observer?.disconnect();
        observer = null;
        document.getElementById(STYLE_ID)?.remove();
        document.querySelectorAll(".sc-copy-btn").forEach(el => el.remove());
    },
});
