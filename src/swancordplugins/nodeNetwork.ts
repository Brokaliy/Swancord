/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * Spider-web particle canvas — port of 7n7.dev
 * Pair with the 7n7 Dark theme for best results.
*/

import { Settings, SettingsStore } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Toasts } from "@webpack/common";

const CANVAS_ID = "swancord-node-network";

const CFG = {
    nodeCount:     140,
    nodeRadius:    2.3,
    lineDistNode:  160,
    lineDistMouse: 220,
    mousePull:     120,
    pullStrength:  0.012,
    repelRadius:   60,
    repelStrength: 0.06,
    speed:         0.35,
};

interface Node { x: number; y: number; vx: number; vy: number; ax: number; ay: number; }

let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let W = 0, H = 0;
let nodes: Node[] = [];
let mouse = { x: -9999, y: -9999 };
let rafId = 0;
let themeListener: (() => void) | null = null;
let prevThemes: string[] = [];

function resize() {
    if (!canvas) return;
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}

function makeNode(): Node {
    const angle = Math.random() * Math.PI * 2;
    const spd   = (0.15 + Math.random() * 0.85) * CFG.speed;
    return {
        x:  Math.random() * W,
        y:  Math.random() * H,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        ax: (Math.random() - 0.5) * 0.002,
        ay: (Math.random() - 0.5) * 0.002,
    };
}

function init() {
    nodes = Array.from({ length: CFG.nodeCount }, makeNode);
}

function update() {
    for (const n of nodes) {
        n.vx += n.ax;
        n.vy += n.ay;

        const spd = Math.hypot(n.vx, n.vy);
        const maxSpd = CFG.speed * 1.8;
        if (spd > maxSpd) { n.vx = (n.vx / spd) * maxSpd; n.vy = (n.vy / spd) * maxSpd; }

        const mdx = n.x - mouse.x;
        const mdy = n.y - mouse.y;
        const md  = Math.hypot(mdx, mdy);
        if (md < CFG.repelRadius && md > 0) {
            const force = (CFG.repelRadius - md) / CFG.repelRadius * CFG.repelStrength;
            n.vx += (mdx / md) * force;
            n.vy += (mdy / md) * force;
        } else if (md < CFG.mousePull && md > 0) {
            const force = (CFG.mousePull - md) / CFG.mousePull * CFG.pullStrength;
            n.vx -= (mdx / md) * force;
            n.vy -= (mdy / md) * force;
        }

        n.x += n.vx;
        n.y += n.vy;

        const m = 40;
        if (n.x < -m) n.x = W + m;
        if (n.x > W + m) n.x = -m;
        if (n.y < -m) n.y = H + m;
        if (n.y > H + m) n.y = -m;
    }
}

function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);

    const rgb = "255,255,255";
    const LD2 = CFG.lineDistNode  * CFG.lineDistNode;
    const LM2 = CFG.lineDistMouse * CFG.lineDistMouse;

    for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < LD2) {
                const alpha = (1 - Math.sqrt(d2) / CFG.lineDistNode) * 0.20;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
                ctx.lineWidth = 0.9;
                ctx.stroke();
            }
        }

        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < LM2) {
            const alpha = (1 - Math.sqrt(md2) / CFG.lineDistMouse) * 0.38;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
        }
    }

    for (const n of nodes) {
        const mdx = n.x - mouse.x;
        const mdy = n.y - mouse.y;
        const md  = Math.hypot(mdx, mdy);
        const highlight = md < CFG.mousePull ? 1 - md / CFG.mousePull : 0;
        const alpha  = 0.22 + highlight * 0.45;
        const radius = CFG.nodeRadius + highlight * 1.4;
        ctx.beginPath();
        ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
        ctx.fill();
    }
}

function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
}

function onMouseMove(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY; }
function onMouseLeave() { mouse.x = -9999; mouse.y = -9999; }
function onResize() { resize(); init(); }

export default definePlugin({
    name: "NodeNetwork",
    description: "Renders the 7n7.dev spider-web particle canvas. Pair with 7n7 Dark theme.",
    authors: [Devs._7n7],
    enabledByDefault: false,
    themeAddon: true,

    start() {
        canvas = document.createElement("canvas");
        canvas.id = CANVAS_ID;
        canvas.style.cssText = "position:fixed;inset:0;z-index:999;pointer-events:none;";
        document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseleave", onMouseLeave);
        window.addEventListener("resize", onResize);

        resize();
        init();
        loop();

        // Notify user to enable this plugin when they turn on 7n7 Dark
        prevThemes = [...(Settings.enabledSwancordThemes ?? [])];
        themeListener = () => {
            const current: string[] = Settings.enabledSwancordThemes ?? [];
            if (current.includes("7n7dark") && !prevThemes.includes("7n7dark")) {
                Toasts.show({
                    message: "7n7 Dark active — enable NodeNetwork in Plugins → Theme-Addons for the particle canvas!",
                    type: Toasts.Type.MESSAGE,
                    id: Toasts.genId(),
                    options: { duration: 6000 },
                });
            }
            prevThemes = [...current];
        };
        SettingsStore.addChangeListener("enabledSwancordThemes", themeListener);
    },

    stop() {
        if (themeListener) {
            SettingsStore.removeChangeListener("enabledSwancordThemes", themeListener);
            themeListener = null;
        }
        cancelAnimationFrame(rafId);
        rafId = 0;
        canvas?.remove();
        canvas = null;
        ctx = null;
        nodes = [];
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseleave", onMouseLeave);
        window.removeEventListener("resize", onResize);
    },
});
