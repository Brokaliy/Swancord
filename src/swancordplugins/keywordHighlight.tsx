/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_ID = "swancord-keyword-highlight";
const WRAP_CLASS = "sc-kw-highlight";

const settings = definePluginSettings({
    keywords: {
        type: OptionType.STRING,
        description: "Comma-separated list of words/phrases to highlight in chat (case-insensitive).",
        default: "",
        onChange: rebuild,
    },
    color: {
        type: OptionType.STRING,
        description: "Highlight background color (any CSS color, e.g. rgba(255,220,0,0.25)).",
        default: "rgba(250,204,21,0.22)",
        onChange: rebuild,
    },
});

let styleEl: HTMLStyleElement | null = null;
let observer: MutationObserver | null = null;

function getKeywords(): string[] {
    return settings.store.keywords
        .split(",")
        .map(k => k.trim())
        .filter(k => k.length > 0);
}

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightNode(node: Text, patterns: RegExp[]) {
    for (const re of patterns) {
        re.lastIndex = 0;
        const text = node.textContent ?? "";
        if (!re.test(text)) continue;
        re.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            const span = document.createElement("span");
            span.className = WRAP_CLASS;
            span.textContent = m[0];
            frag.appendChild(span);
            last = m.index + m[0].length;
        }
        frag.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode?.replaceChild(frag, node);
        return; // only apply first matching pattern per text node
    }
}

function processElement(el: Element, patterns: RegExp[]) {
    if (!patterns.length) return;
    // Skip already-highlighted spans and code blocks
    if (el.closest(`code, pre, .${WRAP_CLASS}, [class*="codeContainer"]`)) return;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode())) nodes.push(n as Text);
    nodes.forEach(node => highlightNode(node, patterns));
}

function processAll() {
    const keywords = getKeywords();
    if (!keywords.length) return;
    const patterns = keywords.map(k => new RegExp(escapeRegex(k), "gi"));
    document.querySelectorAll<Element>("[class*='messageContent_']").forEach(el => {
        if (!el.querySelector(`.${WRAP_CLASS}`)) processElement(el, patterns);
    });
}

function rebuild() {
    // Remove all existing highlights
    document.querySelectorAll(`.${WRAP_CLASS}`).forEach(el => {
        el.replaceWith(document.createTextNode(el.textContent ?? ""));
    });

    if (styleEl) {
        const color = settings.store.color || "rgba(250,204,21,0.22)";
        styleEl.textContent = `
            .${WRAP_CLASS} {
                background: ${color} !important;
                border-radius: 3px !important;
                padding: 0 2px !important;
                font-weight: 500 !important;
            }
        `;
    }
    processAll();
}

export default definePlugin({
    name: "KeywordHighlight",
    description: "Highlights custom keywords in chat messages. Configure your keywords in plugin settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        styleEl = document.createElement("style");
        styleEl.id = STYLE_ID;
        document.head.appendChild(styleEl);
        rebuild();

        observer = new MutationObserver(() => {
            const keywords = getKeywords();
            if (!keywords.length) return;
            const patterns = keywords.map(k => new RegExp(escapeRegex(k), "gi"));
            document.querySelectorAll<Element>("[class*='messageContent_']:not(:has(." + WRAP_CLASS + "))").forEach(
                el => processElement(el, patterns)
            );
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        observer?.disconnect();
        observer = null;
        styleEl?.remove();
        styleEl = null;
        document.querySelectorAll(`.${WRAP_CLASS}`).forEach(el => {
            el.replaceWith(document.createTextNode(el.textContent ?? ""));
        });
    },
});
