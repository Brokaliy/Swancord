/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * imageViewer — enhanced image viewing
 *
 * Replaces Discord's default image viewer behaviour with a fully-featured
 * viewer that supports:
 *   • Smooth scroll-to-zoom (cursor-aware)
 *   • Click-and-drag panning (only when zoomed in)
 *   • Arrow-key nudging
 *   • Loads full-resolution images (strips Discord's width/height query params)
 *   • Gallery navigation (swapping images in the same wrapper is handled via
 *     a MutationObserver)
 *
 * Original concept: BetterImageViewer by Tony (Legend-Master)
 * Rewritten for Vencord / Swancord by 7n7 (1cwo)
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const SCALE_FACTOR     = 1.2;
const KEY_STEP_PX      = 100;
const TRANSITION_MS    = 150;

/** Only attach to image wrappers — exclude lazy/zoomed placeholders */
const WRAPPER_SEL = 'div[class*="imageWrapper_"]:not([class*="lazyImg_"],[class*="imageZoom_"])';

// ─── Settings ────────────────────────────────────────────────────────────────

const settings = definePluginSettings({
    zoomStep: {
        type: OptionType.SLIDER,
        description: "Zoom step per scroll wheel tick (1.1 = 10 % per notch)",
        markers: [1.1, 1.15, 1.2, 1.3, 1.5],
        default: 1.2,
        stickToMarkers: false,
    },
    keyStep: {
        type: OptionType.SLIDER,
        description: "Arrow-key pan distance in pixels",
        markers: [40, 80, 100, 150, 200],
        default: 100,
        stickToMarkers: true,
    },
    fullResolution: {
        type: OptionType.BOOLEAN,
        description: "Always load the full-resolution image (strips Discord size parameters)",
        default: true,
    },
});

// ─── Viewer class ─────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number) {
    return Math.min(hi, Math.max(lo, n));
}

class ImageViewer {
    private image: HTMLImageElement;
    private wrapper: HTMLDivElement;
    private backdrop: HTMLDivElement;

    private scale  = 1;
    private dx     = 0;
    private dy     = 0;
    private moved  = false;

    private initialTransition: string;
    private transitionCSS: string;
    private childObserver: MutationObserver;

    constructor(image: HTMLImageElement, wrapper: HTMLDivElement, backdrop: HTMLDivElement) {
        this.image   = image;
        this.wrapper = wrapper;
        this.backdrop = backdrop;

        this.initialTransition = image.style.transition;
        this.transitionCSS = [
            `scale ${TRANSITION_MS}ms`,
            `translate ${TRANSITION_MS}ms`,
            this.initialTransition,
        ].filter(Boolean).join(",");

        this.wrapper.style.cursor = "move";
        this.applyImageBaseStyle();
        this.loadFullResolution();

        document.addEventListener("mousedown", this.onMouseDown);
        document.addEventListener("keydown",   this.onKeyDown);
        document.addEventListener("wheel",     this.onWheel, { passive: false });
        this.wrapper.addEventListener("click", this.onClick);
        this.image.addEventListener("load",    this.onImageLoad);

        // Handle gallery image swaps
        this.childObserver = new MutationObserver(records => {
            for (const rec of records) {
                for (const node of rec.addedNodes) {
                    if (node instanceof HTMLImageElement) {
                        this.image.removeEventListener("load", this.onImageLoad);
                        this.image = node;
                        this.image.addEventListener("load", this.onImageLoad);
                        this.reset();
                        return;
                    }
                }
            }
        });
        this.childObserver.observe(this.wrapper, { childList: true, subtree: true });
    }

    exit() {
        this.wrapper.style.cursor = "";
        this.image.style.transition = this.initialTransition;
        document.removeEventListener("mousedown", this.onMouseDown);
        document.removeEventListener("keydown",   this.onKeyDown);
        document.removeEventListener("wheel",     this.onWheel);
        this.wrapper.removeEventListener("click", this.onClick);
        this.image.removeEventListener("load",    this.onImageLoad);
        this.childObserver.disconnect();
    }

    // ── Internal helpers ───────────────────────────────────────────────────────

    private get wrapperW() { return this.wrapper.clientWidth; }
    private get wrapperH() { return this.wrapper.clientHeight; }

    private reset() {
        this.scale = 1;
        this.dx = 0;
        this.dy = 0;
        this.moved = false;
        this.applyImageBaseStyle();
        this.loadFullResolution();
        this.updateTransform();
    }

    private applyImageBaseStyle() {
        Object.assign(this.image.style, {
            cursor:    "move",
            position:  "unset",
            top:       "unset",
            left:      "unset",
            width:     "unset",
            height:    "unset",
            maxWidth:  "90vw",
            maxHeight: "90vh",
        });
    }

    private loadFullResolution() {
        if (!settings.store.fullResolution) return;
        try {
            const url = new URL(this.image.src);
            url.searchParams.delete("width");
            url.searchParams.delete("height");
            const clean = url.toString();
            if (clean !== this.image.src) this.image.src = clean;
        } catch { /* relative URL or blob — ignore */ }
    }

    private updateTransform(transition = false) {
        this.image.style.transition = transition ? this.transitionCSS : this.initialTransition;
        this.image.style.scale     = String(this.scale);
        this.image.style.translate = `${this.dx}px ${this.dy}px`;
    }

    private getImageRect() {
        return { w: this.image.width, h: this.image.height };
    }

    private pan(ddx: number, ddy: number) {
        if (this.scale === 1) return;
        const { w, h } = this.getImageRect();
        const maxDX = Math.max((w * this.scale - this.wrapperW) / 2, 0);
        const maxDY = Math.max((h * this.scale - this.wrapperH) / 2, 0);
        this.dx = clamp(this.dx + ddx, -maxDX, maxDX);
        this.dy = clamp(this.dy + ddy, -maxDY, maxDY);
        this.updateTransform(false);
        this.moved = true;
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    private onImageLoad = () => {
        this.applyImageBaseStyle();
        if (settings.store.fullResolution) this.loadFullResolution();
    };

    private onClick = (ev: MouseEvent) => {
        if (!this.moved) this.backdrop.click();
        ev.stopImmediatePropagation();
    };

    private onMouseDown = (ev: MouseEvent) => {
        this.moved = false;
        const onMove = (me: MouseEvent) => {
            if (me.movementX === 0 && me.movementY === 0) return;
            this.pan(me.movementX, me.movementY);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", me => {
            me.stopImmediatePropagation();
            document.removeEventListener("mousemove", onMove);
        }, { once: true, capture: true });
        ev.preventDefault();
    };

    private onKeyDown = (ev: KeyboardEvent) => {
        const step = settings.store.keyStep ?? KEY_STEP_PX;
        switch (ev.key) {
            case "ArrowUp":    this.pan(0,  step);  break;
            case "ArrowDown":  this.pan(0, -step);  break;
            case "ArrowLeft":  this.pan( step, 0);  break;
            case "ArrowRight": this.pan(-step, 0);  break;
        }
    };

    private onWheel = (ev: WheelEvent) => {
        const delta = ev.deltaX || ev.deltaY || ev.deltaZ;
        if (delta === 0) return;
        ev.preventDefault();

        const factor = settings.store.zoomStep ?? SCALE_FACTOR;
        const zoomIn = delta < 0;
        let target = zoomIn ? this.scale * factor : this.scale / factor;

        if (target <= 1) {
            this.scale = 1;
            this.dx    = 0;
            this.dy    = 0;
        } else {
            // Zoom towards cursor position
            const { w, h } = this.getImageRect();
            const scaledW  = w * this.scale;
            const scaledH  = h * this.scale;
            const left   = (this.wrapperW - scaledW) / 2 + this.dx + innerWidth  * 0.05;
            const right  = (this.wrapperW + scaledW) / 2 + this.dx + innerWidth  * 0.05;
            const top    = (this.wrapperH - scaledH) / 2 + this.dy + innerHeight * 0.05;
            const bottom = (this.wrapperH + scaledH) / 2 + this.dy + innerHeight * 0.05;
            const ds     = target - this.scale;

            const outside = ev.clientX < left || ev.clientX > right ||
                            ev.clientY < top  || ev.clientY > bottom;
            const cx = (left + right)   / 2;
            const cy = (top  + bottom)  / 2;
            const ddx = outside ? 0 : ((cx - clamp(ev.clientX, left, right)) / this.scale) * ds;
            const ddy = outside ? 0 : ((cy - clamp(ev.clientY, top, bottom))  / this.scale) * ds;

            if (zoomIn) {
                this.dx += ddx;
                this.dy += ddy;
            } else {
                // Interpolate deltas back towards zero as scale returns to 1
                const ratio = (target - 1) / (this.scale - 1);
                this.dx = clamp(this.dx + ddx, Math.min(this.dx * ratio, 0), Math.max(this.dx * ratio, 0));
                this.dy = clamp(this.dy + ddy, Math.min(this.dy * ratio, 0), Math.max(this.dy * ratio, 0));
            }

            this.scale = target;
        }

        this.updateTransform(true);
    };
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

let viewer: ImageViewer | undefined;
let activeWrapper: HTMLDivElement | undefined;
let domObserver: MutationObserver | null = null;

function exitViewer() {
    viewer?.exit();
    viewer = undefined;
    activeWrapper = undefined;
}

function tryAttach(wrapper: HTMLDivElement): boolean {
    // The loading overlay confirms we're inside a modal / carousel
    const loadingOverlay = wrapper.querySelector<HTMLDivElement>('[class*="loadingOverlay_"]');
    if (!loadingOverlay) return false;

    const backdrop = document.querySelector<HTMLDivElement>('[class*="carouselModal_"]');
    if (!backdrop) return false;

    const image = wrapper.querySelector("img");
    if (!image || !wrapper.parentElement) return false;

    // Ensure wrapper fills viewport so panning has room
    wrapper.style.width  = "90vw";
    wrapper.style.height = "90vh";
    loadingOverlay.style.display     = "grid";
    loadingOverlay.style.placeItems  = "center";

    exitViewer();
    viewer        = new ImageViewer(image, wrapper, backdrop);
    activeWrapper = wrapper;
    return true;
}

function getWrapperFromNode(node: HTMLElement): HTMLDivElement | null {
    if (node.matches('[class*="layer_"]') || node.matches('[class*="zoomedMediaFitWrapper_"]')) {
        return node.querySelector<HTMLDivElement>(WRAPPER_SEL);
    }
    if (node.matches(WRAPPER_SEL)) return node as HTMLDivElement;
    if (node instanceof HTMLImageElement) {
        const w = document.querySelector<HTMLDivElement>(WRAPPER_SEL);
        if (w?.contains(node)) return w;
    }
    return null;
}

function onMutation(records: MutationRecord[]) {
    // Clean up if modal was closed
    if (activeWrapper && !document.contains(activeWrapper)) exitViewer();

    for (const rec of records) {
        for (const node of rec.addedNodes) {
            if (!(node instanceof HTMLElement)) continue;
            const wrapper = getWrapperFromNode(node);
            if (wrapper && tryAttach(wrapper)) return;
        }
    }
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "ImageViewer",
    description: "Enhanced Discord image viewer: scroll to zoom, drag to pan, arrow keys to nudge, full resolution loading.",
    authors: [Devs._7n7],
    settings,

    start() {
        domObserver = new MutationObserver(onMutation);
        domObserver.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        exitViewer();
        domObserver?.disconnect();
        domObserver = null;
    },
});
