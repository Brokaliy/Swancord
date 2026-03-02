/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * mediaPlayerPlus — enhanced media controls
 *
 * Adds missing features to Discord's built-in media player:
 *   • Loop toggle button (persists across videos)
 *   • Picture-in-Picture button (native browser PiP API)
 *   • Download button with filename
 *   • Playback speed selector (0.25× – 2×)
 *   • Volume persistence across sessions
 *   • Remembers loop preference
 *
 * Original concept: BetterMediaPlayer by unknown81311 & Doggybootsy
 * Rewritten for Vencord / Swancord by 7n7 (1cwo)
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// ─── Settings ─────────────────────────────────────────────────────────────────

const settings = definePluginSettings({
    persistVolume: {
        type: OptionType.BOOLEAN,
        description: "Restore volume level on every video",
        default: true,
    },
    defaultLoop: {
        type: OptionType.BOOLEAN,
        description: "Start every video with loop enabled",
        default: false,
    },
    showSpeedControl: {
        type: OptionType.BOOLEAN,
        description: "Show a playback-speed selector in the controls bar",
        default: true,
    },
    showDownload: {
        type: OptionType.BOOLEAN,
        description: "Show a download button in the controls bar",
        default: true,
    },
});

// ─── Constants ────────────────────────────────────────────────────────────────

const STYLE_ID    = "swancord-mpp-style";
const BAR_ATTR    = "data-mpp-wired";
const SPEEDS      = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const VOL_KEY     = "mpp_volume";
const LOOP_KEY    = "mpp_loop";

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadFloat(key: string, fallback: number): number {
    try { return parseFloat(localStorage.getItem(key) ?? "") || fallback; } catch { return fallback; }
}
function loadBool(key: string, fallback: boolean): boolean {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v === "1";
}
function save(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* private-mode */ }
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function svgIcon(path: string, viewBox = "0 0 24 24"): SVGSVGElement {
    const ns  = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("width",  "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("fill",   "currentColor");
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", path);
    svg.appendChild(p);
    return svg;
}

const LOOP_PATH = "M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z";
const PIP_PATH  = "M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z";
const DL_PATH   = "M16.293 9.293L17.707 10.707L12 16.414L6.293 10.707L7.707 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18 20V18H20V20C20 21.1 19.1 22 18 22H6C4.9 22 4 21.1 4 20V18H6V20H18Z";

// ─── Button builders ──────────────────────────────────────────────────────────

function makeBtn(className: string, title: string, onClick: (ev: MouseEvent) => void): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.className = `mpp-btn ${className}`;
    btn.title = title;
    btn.type  = "button";
    btn.addEventListener("click", ev => { ev.stopPropagation(); onClick(ev); });
    return btn;
}

/** Loop toggle */
function buildLoopBtn(video: HTMLVideoElement): HTMLButtonElement {
    const loop = loadBool(LOOP_KEY, settings.store.defaultLoop);
    video.loop = loop;

    const btn = makeBtn("mpp-loop", "Toggle loop", () => {
        video.loop = !video.loop;
        save(LOOP_KEY, video.loop ? "1" : "0");
        btn.classList.toggle("mpp-active", video.loop);
    });
    btn.appendChild(svgIcon(LOOP_PATH));
    btn.classList.toggle("mpp-active", loop);
    return btn;
}

/** Native Picture-in-Picture button */
function buildPipBtn(video: HTMLVideoElement): HTMLButtonElement | null {
    if (!document.pictureInPictureEnabled) return null;

    const btn = makeBtn("mpp-pip", "Picture in Picture", async () => {
        try {
            if (document.pictureInPictureElement === video) {
                await document.exitPictureInPicture();
                btn.classList.remove("mpp-active");
            } else {
                await video.requestPictureInPicture();
                btn.classList.add("mpp-active");
            }
        } catch { /* PiP refused — ignore */ }
    });
    btn.appendChild(svgIcon(PIP_PATH));

    video.addEventListener("leavepictureinpicture", () => btn.classList.remove("mpp-active"));
    video.addEventListener("enterpictureinpicture", () => btn.classList.add("mpp-active"));
    return btn;
}

/** Download anchor disguised as a button */
function buildDlBtn(src: string): HTMLAnchorElement {
    const a = document.createElement("a");
    a.className = "mpp-btn mpp-dl";
    a.title     = "Download";
    a.href      = src.split("?")[0]; // strip Discord's tracking params
    a.download  = src.split("?")[0].split("/").pop() ?? "video";
    a.target    = "_blank";
    a.rel       = "noreferrer noopener";
    a.appendChild(svgIcon(DL_PATH));
    a.addEventListener("click", e => e.stopPropagation());
    return a;
}

/** Playback speed <select> */
function buildSpeedSelect(video: HTMLVideoElement): HTMLSelectElement {
    const sel = document.createElement("select");
    sel.className = "mpp-speed";
    sel.title     = "Playback speed";

    for (const s of SPEEDS) {
        const opt  = document.createElement("option");
        opt.value  = String(s);
        opt.text   = `${s}×`;
        if (s === 1) opt.selected = true;
        sel.appendChild(opt);
    }

    sel.addEventListener("change", ev => {
        ev.stopPropagation();
        video.playbackRate = parseFloat(sel.value);
    });
    sel.addEventListener("click", ev => ev.stopPropagation());
    return sel;
}

// ─── Wiring ───────────────────────────────────────────────────────────────────

/**
 * Finds the innermost controls row inside a Discord media player wrapper.
 * Discord renders something like:
 *   wrapper > video-with-bg > controls-bar [class*="controls_"]
 */
function findControlsBar(wrapper: HTMLElement): HTMLElement | null {
    return wrapper.querySelector<HTMLElement>(
        '[class*="controls_"], [class*="mediaControls_"], [class*="controlsContainer_"]'
    );
}

function wireVideoElement(video: HTMLVideoElement) {
    // Walk up to find the wrapper that Discord renders around the video
    let wrapper: HTMLElement | null = video.parentElement;
    let depth = 0;
    while (wrapper && depth < 6) {
        if (
            wrapper.className?.includes("mediaPlayer_") ||
            wrapper.className?.includes("videoWrapper_") ||
            wrapper.className?.includes("wrapperPaused_") ||
            wrapper.className?.includes("container_")
        ) break;
        wrapper = wrapper.parentElement;
        depth++;
    }
    if (!wrapper) return;

    const controls = findControlsBar(wrapper);
    if (!controls || controls.getAttribute(BAR_ATTR)) return;
    controls.setAttribute(BAR_ATTR, "1");

    // Persist / restore volume
    if (settings.store.persistVolume) {
        const vol = loadFloat(VOL_KEY, 1);
        video.volume = Math.min(1, Math.max(0, vol));
        video.addEventListener("volumechange", () => save(VOL_KEY, String(video.volume)));
    }

    // Build extra buttons
    const loopBtn  = buildLoopBtn(video);
    const pipBtn   = buildPipBtn(video);
    const speedSel = settings.store.showSpeedControl ? buildSpeedSelect(video) : null;
    const dlBtn    = settings.store.showDownload     ? buildDlBtn(video.src || video.currentSrc) : null;

    // Inject before the last existing child so we appear inside the bar
    const ref = controls.lastElementChild ?? null;
    controls.insertBefore(loopBtn, ref);
    if (pipBtn)   controls.insertBefore(pipBtn,   ref);
    if (speedSel) controls.insertBefore(speedSel, ref);
    if (dlBtn)    controls.insertBefore(dlBtn,    ref);
}

// ─── MutationObserver ─────────────────────────────────────────────────────────

let domObserver: MutationObserver | null = null;

function scanAndWire(root: HTMLElement = document.body) {
    root.querySelectorAll<HTMLVideoElement>("video").forEach(wireVideoElement);
}

function onMutation(records: MutationRecord[]) {
    for (const rec of records) {
        for (const node of rec.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            if (node instanceof HTMLVideoElement) {
                wireVideoElement(node);
            } else {
                scanAndWire(node);
            }
        }
    }
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const MPP_CSS = `
.mpp-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    padding: 4px;
    border-radius: 4px;
    cursor: pointer;
    color: var(--interactive-normal);
    transition: color 100ms, background-color 100ms;
    text-decoration: none;
    flex-shrink: 0;
}
.mpp-btn:hover {
    color: var(--interactive-hover);
    background: var(--background-modifier-hover);
}
.mpp-btn:active {
    color: var(--interactive-active);
    background: var(--background-modifier-active);
}
.mpp-active {
    color: var(--brand-500) !important;
}
.mpp-speed {
    background: var(--background-secondary);
    border: 1px solid var(--background-modifier-accent);
    border-radius: 4px;
    color: var(--text-normal);
    font-size: 11px;
    padding: 2px 4px;
    cursor: pointer;
    align-self: center;
    margin: 0 2px;
}
.mpp-speed:hover {
    border-color: var(--interactive-hover);
}
`;

function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = MPP_CSS;
    document.head.appendChild(el);
}

function removeCSS() {
    document.getElementById(STYLE_ID)?.remove();
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "MediaPlayerPlus",
    description: "Adds loop, Picture-in-Picture, download, and speed controls to Discord's video player. Persists volume across sessions.",
    authors: [Devs._7n7],
    settings,

    start() {
        injectCSS();

        domObserver = new MutationObserver(onMutation);
        domObserver.observe(document.body, { childList: true, subtree: true });

        // Wire any videos already present (e.g. re-enable on settings toggle)
        scanAndWire();
    },

    stop() {
        domObserver?.disconnect();
        domObserver = null;

        // Clean up all injected controls
        document.querySelectorAll(`[${BAR_ATTR}]`).forEach(el => {
            el.removeAttribute(BAR_ATTR);
            el.querySelectorAll(".mpp-btn, .mpp-speed").forEach(b => b.remove());
        });

        removeCSS();
    },
});
