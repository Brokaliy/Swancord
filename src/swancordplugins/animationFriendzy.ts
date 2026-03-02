/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * AnimationFriendzy — full Discord animation overhaul.
 * By 7n7 (1cwo) for Swancord.
 *
 * Architecture: MutationObserver + Web Animations API (WAAPI)
 * ───────────────────────────────────────────────────────────
 * Why WAAPI instead of CSS injection:
 *   • Each element is animated individually — no CSS specificity fights
 *   • Per-element duration, easing, and direction independently
 *   • Proper exit animations: fixed-position clone fades out after removal
 *   • Accordion messages: height + opacity, only new messages in viewport
 *   • Auto-direction from Flux events, applied per animation call
 *   • Works regardless of Discord class name scrambling (class* matching)
 *   • Settings changes take effect on next element, no page reload needed
 *
 * Improvements over BetterAnimations (arg0NNY):
 *   + No React lifecycle patches — immune to Discord React version changes
 *   + 11 animation kinds vs original 6-8
 *   + Per-module independent easing (not just duration)
 *   + IntersectionObserver gating — history scrollback never spams animations
 *   + Spring physics, Blur, Ripple, Wipe, Grow — new effect types
 *   + Context menu appears from click position (top-left/bottom-right aware)
 *   + Server icon bounce on hover / channel hover slide as bonus polish
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { FluxDispatcher } from "@webpack/common";

// ─── Types ────────────────────────────────────────────────────────────────────

type AnimKind =
    | "fade" | "slide" | "scale" | "scale-bounce"
    | "flip-x" | "flip-y" | "rotate" | "wipe"
    | "grow" | "blur" | "ripple" | "none";

type EasingName = "smooth" | "snappy" | "bouncy" | "linear" | "elastic" | "spring";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOVER_STYLE_ID = "swancord-af-hover";
const ANIMATED_ATTR  = "data-af-animated";
const EXIT_ZINDEX    = "9999";

const EasingCSS: Record<EasingName, string> = {
    // Steep fast start, very long soft tail — the gold standard for fluid UI
    smooth:  "cubic-bezier(0.16, 1, 0.3, 1)",
    snappy:  "cubic-bezier(0.34, 1.0,  0.64, 1.0)",
    bouncy:  "cubic-bezier(0.34, 1.56, 0.64, 1.0)",
    linear:  "linear",
    elastic: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
    spring:  "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
};

/** translate values (from → to 0,0) for enter slide animations */
const SlideTranslate: Record<string, [string, string]> = {
    up:       ["0", "14px"],
    down:     ["0", "-14px"],
    left:     ["16px", "0"],
    right:    ["-16px", "0"],
    forwards: ["14px", "0"],
};

// ─── WAAPI keyframes ──────────────────────────────────────────────────────────

function enterKeyframes(kind: AnimKind, dir: string): Keyframe[] {
    const [tx, ty] = SlideTranslate[dir] ?? SlideTranslate.up;

    switch (kind) {
        case "fade":
            return [{ opacity: 0 }, { opacity: 1 }];

        case "slide":
            return [
                { opacity: 0, transform: `translate(${tx}, ${ty})` },
                { opacity: 1, transform: "translate(0, 0)" },
            ];

        case "scale":
            return [
                { opacity: 0, transform: "scale(0.88)" },
                { opacity: 1, transform: "scale(1)" },
            ];

        case "scale-bounce":
            return [
                { opacity: 0,   transform: "scale(0.72)" },
                { opacity: 0.8, transform: "scale(1.05)", offset: 0.7 },
                { opacity: 1,   transform: "scale(1)" },
            ];

        case "flip-x":
            return [
                { opacity: 0, transform: "perspective(800px) rotateX(30deg) scale(0.92)" },
                { opacity: 1, transform: "perspective(800px) rotateX(0deg) scale(1)" },
            ];

        case "flip-y":
            return [
                { opacity: 0, transform: "perspective(800px) rotateY(30deg) scale(0.92)" },
                { opacity: 1, transform: "perspective(800px) rotateY(0deg) scale(1)" },
            ];

        case "rotate":
            return [
                { opacity: 0, transform: "rotate(-10deg) scale(0.86)" },
                { opacity: 1, transform: "rotate(0deg) scale(1)" },
            ];

        case "wipe": {
            const clipFrom: Record<string, string> = {
                up: "inset(100% 0 0 0)", down: "inset(0 0 100% 0)",
                left: "inset(0 0 0 100%)", right: "inset(0 100% 0 0)", forwards: "inset(0 100% 0 0)",
            };
            return [
                { opacity: 0.3, clipPath: clipFrom[dir] ?? clipFrom.up },
                { opacity: 1, clipPath: "inset(0 0 0 0)" },
            ];
        }

        case "grow":
            return [
                { opacity: 0, transform: "scaleY(0.25) scaleX(0.65)" },
                { opacity: 0.7, transform: "scaleY(1.04) scaleX(1.01)", offset: 0.75 },
                { opacity: 1, transform: "scale(1)" },
            ];

        case "blur":
            return [
                { opacity: 0, filter: "blur(10px)" },
                { opacity: 1, filter: "blur(0px)" },
            ];

        case "ripple":
            return [
                { opacity: 0, transform: "scale(0.5)" },
                { opacity: 0.9, transform: "scale(1.06)", offset: 0.65 },
                { opacity: 1, transform: "scale(1)" },
            ];

        case "none":
        default:
            return [];
    }
}

function exitKeyframes(kind: AnimKind): Keyframe[] {
    // Exit is mostly a reversed enter — we use simplified versions
    switch (kind) {
        case "slide": case "wipe":
            return [{ opacity: 1, transform: "translate(0,0)" }, { opacity: 0, transform: "translate(0, -12px)" }];
        case "scale": case "scale-bounce": case "grow": case "ripple":
            return [{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(0.82)" }];
        case "blur":
            return [{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(8px)" }];
        case "rotate":
            return [{ opacity: 1, transform: "rotate(0deg)" }, { opacity: 0, transform: "rotate(6deg) scale(0.88)" }];
        case "flip-x": case "flip-y":
            return [{ opacity: 1 }, { opacity: 0, transform: "scale(0.88)" }];
        default:
            return [{ opacity: 1 }, { opacity: 0 }];
    }
}

// ─── Auto-direction tracker ───────────────────────────────────────────────────

const dirState = {
    prevGuildIndex: -1,
    prevChannelIndex: -1,
    direction: "forward" as "forward" | "backward",
};

function resolveDir(raw: string): string {
    if (raw !== "auto") return raw;
    return dirState.direction === "backward" ? "down" : "up";
}

/** Clear data-af-animated from all message-level elements so the next pass re-animates them */
function clearMessageAnimMarkers() {
    document.querySelectorAll<HTMLElement>(
        `[id^="chat-messages-"][${ANIMATED_ATTR}], [class*="messageListItem_"][${ANIMATED_ATTR}]`
    ).forEach(el => el.removeAttribute(ANIMATED_ATTR));
}

/** Handle a new incoming message — plays the dedicated send/receive pop-in animation */
function onMessageCreate(event: any) {
    if (!settings.store.sendAnim) return;
    if (shouldSkipReduceMotion()) return;
    const msgId = event?.message?.id;
    const channelId = event?.channelId ?? event?.message?.channel_id;
    if (!msgId || !channelId) return;

    // Wait for Discord to render the element
    setTimeout(() => {
        const el = document.querySelector<HTMLElement>(
            `[id="chat-messages-${channelId}-${msgId}"]`
        );
        if (!el) return;
        // Override whatever the MO played — send animation takes priority
        el.getAnimations().forEach(a => a.cancel());
        el.removeAttribute(ANIMATED_ATTR);
        el.setAttribute(ANIMATED_ATTR, "sent");
        el.style.transformOrigin = "left bottom";
        el.style.overflow = "";

        const opts = getModuleOptions("sentMessage");
        const frames = enterKeyframes(opts.kind, opts.dir);
        if (!frames.length) return;
        el.animate(frames, {
            duration: opts.duration,
            easing: EasingCSS[opts.easing] ?? EasingCSS.bouncy,
            fill: "backwards",
        });
    }, 80);
}

function onChannelSelect(event: any) {
    const channelId: string = event?.channelId ?? "";
    if (!channelId) return;
    const isDM = !event?.guildId;

    if (isDM) {
        // ── DM / group DM switch ─────────────────────────────────────────
        const dmItems = Array.from(
            document.querySelectorAll<HTMLElement>("[data-list-item-id^='private-channels-']")
        );
        const dmIdx = dmItems.findIndex(el => el.dataset.listItemId?.endsWith(channelId));
        if (dmIdx !== -1 && dirState.prevChannelIndex !== -1) {
            dirState.direction = dmIdx >= dirState.prevChannelIndex ? "forward" : "backward";
        }
        if (dmIdx !== -1) dirState.prevChannelIndex = dmIdx;

        animateChatAreaForModule("dm");
        if (settings.store.dmListAnim) setTimeout(() => animateDMList(channelId), 40);
        // Clear markers immediately so both the MO and the polling passes can re-animate
        clearMessageAnimMarkers();
        setTimeout(animateVisibleMessages, 60);   // fast path: cached channels
        setTimeout(animateVisibleMessages, 350);  // slow path: network-loaded channels
    } else {
        // ── Guild channel switch ──────────────────────────────────────────
        const items = Array.from(
            document.querySelectorAll<HTMLElement>("[data-list-item-id^='channels___']")
        );
        const idx = items.findIndex(el => el.dataset.listItemId?.endsWith(channelId));
        if (idx !== -1 && dirState.prevChannelIndex !== -1) {
            dirState.direction = idx >= dirState.prevChannelIndex ? "forward" : "backward";
        }
        if (idx !== -1) dirState.prevChannelIndex = idx;

        animateChatAreaForModule("channel");
        // Clear markers immediately so both the MO and the polling passes can re-animate
        clearMessageAnimMarkers();
        setTimeout(animateVisibleMessages, 60);   // fast path: cached channels
        setTimeout(animateVisibleMessages, 350);  // slow path: network-loaded channels
    }
}

function onGuildSelect(event: any) {
    const guildId: string = event?.guildId ?? "";
    if (!guildId) return;
    const items = Array.from(
        document.querySelectorAll<HTMLElement>("[data-list-item-id^='guildsnav___']")
    );
    const idx = items.findIndex(el => el.dataset.listItemId?.endsWith(guildId));
    if (idx !== -1 && dirState.prevGuildIndex !== -1) {
        dirState.direction = idx >= dirState.prevGuildIndex ? "forward" : "backward";
    }
    if (idx !== -1) dirState.prevGuildIndex = idx;
    // Animate chat area and channel sidebar on guild switch
    animateChatArea();
    setTimeout(animateChannelList, 60);
    clearMessageAnimMarkers();
    setTimeout(animateVisibleMessages, 80);
    setTimeout(animateVisibleMessages, 380);
}

// ─── Imperative channel / content animations ──────────────────────────────────

/**
 * Animate the chat content area. Accepts a module id so DMs use their own settings.
 * Discord REUSES this element on every channel switch — MutationObserver never fires.
 */
function animateChatAreaForModule(moduleId: "channel" | "dm") {
    if (shouldSkipReduceMotion()) return;
    const opts = getModuleOptions(moduleId);
    if (opts.kind === "none") return;
    // Fallback chain — Discord renames classes; try each independently
    const chatArea =
        document.querySelector<HTMLElement>("[class*='messagesWrapper_']") ??
        document.querySelector<HTMLElement>("[class*='chatContent_']") ??
        document.querySelector<HTMLElement>("[class*='chat_'] [class*='content_']") ??
        document.querySelector<HTMLElement>("[class*='scroller_'][role='list']");
    if (!chatArea) return;
    chatArea.style.transformOrigin = "center top";
    const frames = enterKeyframes(opts.kind, opts.dir);
    if (!frames.length) return;
    chatArea.getAnimations().forEach(a => a.cancel());
    chatArea.animate(frames, {
        duration: opts.duration,
        easing: EasingCSS[opts.easing] ?? EasingCSS.smooth,
        fill: "backwards",
    });
}

/** Legacy alias kept for onGuildSelect */
function animateChatArea() { animateChatAreaForModule("channel"); }

/**
 * Stagger-animate the currently-visible message elements after a channel/DM switch.
 * Required because Discord RECYCLES message DOM nodes — MutationObserver never fires,
 * and elements still carry data-af-animated from the previous channel.
 */
function animateVisibleMessages() {
    if (shouldSkipReduceMotion()) return;
    const opts = getModuleOptions("message");
    if (opts.kind === "none") return;
    const frames = enterKeyframes(opts.kind, opts.dir);
    if (!frames.length) return;
    // Try stable ID-based selector first, fall back to class-based
    let msgs = Array.from(document.querySelectorAll<HTMLElement>('[id^="chat-messages-"]'));
    if (!msgs.length) {
        msgs = Array.from(document.querySelectorAll<HTMLElement>(
            "[class*='messageListItem_'], [class*='message_'][class*='groupStart_']"
        ));
    }
    if (!msgs.length) return;
    msgs.forEach((el, i) => {
        if (i >= 30) return; // cap stagger depth
        el.removeAttribute(ANIMATED_ATTR);
        el.setAttribute(ANIMATED_ATTR, "1");
        el.style.transformOrigin = "center top";
        el.getAnimations().forEach(a => a.cancel());
        el.animate(frames, {
            duration: opts.duration,
            delay: Math.min(i * 16, 320),
            easing: EasingCSS[opts.easing] ?? EasingCSS.smooth,
            fill: "backwards",
        });
    });
}

/** Animate the channel list rows in the sidebar — staggered slide + overshoot bounce */
function animateChannelList() {
    if (shouldSkipReduceMotion()) return;
    const rows = document.querySelectorAll<HTMLElement>(
        "[data-list-item-id^='channels___']"
    );
    rows.forEach((row, i) => {
        row.getAnimations().forEach(a => a.cancel());
        row.animate([
            { opacity: 0,   transform: "translateX(-16px) scale(0.93)" },
            { opacity: 0.8, transform: "translateX(3px)   scale(1.02)", offset: 0.72 },
            { opacity: 1,   transform: "translateX(0)     scale(1)" },
        ], {
            duration: 240,
            delay: Math.min(i * 15, 260),
            easing: EasingCSS.smooth,
            fill: "backwards",
        });
    });
}

/** Animate the DM list sidebar — staggered slide + subtle grow */
function animateDMList(selectedChannelId?: string) {
    if (shouldSkipReduceMotion()) return;
    const rows = document.querySelectorAll<HTMLElement>(
        "[data-list-item-id^='private-channels-']"
    );
    rows.forEach((row, i) => {
        row.getAnimations().forEach(a => a.cancel());
        const isSelected = !!selectedChannelId && !!row.dataset.listItemId?.endsWith(selectedChannelId);
        row.animate([
            { opacity: 0,   transform: "translateX(-14px) scale(0.94)" },
            { opacity: 0.85, transform: `translateX(${isSelected ? "4px" : "2px"}) scale(${isSelected ? "1.04" : "1.01"})`, offset: 0.7 },
            { opacity: 1,   transform: "translateX(0) scale(1)" },
        ], {
            duration: isSelected ? 300 : 220,
            delay: Math.min(i * 18, 280),
            easing: EasingCSS.smooth,
            fill: "backwards",
        });
    });
}

/** Click feedback pulse on a channel or DM row when the user selects it */
function onChannelClickAF(e: MouseEvent) {
    const row = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-list-item-id^='channels___'], [data-list-item-id^='private-channels-']"
    );
    if (!row) return;
    row.getAnimations().forEach(a => a.cancel());
    row.animate([
        { transform: "scale(1)" },
        { transform: "scale(0.96)", offset: 0.35 },
        { transform: "scale(1.015)", offset: 0.75 },
        { transform: "scale(1)" },
    ], { duration: 220, easing: EasingCSS.bouncy, fill: "none" });
}

// ─── Voice channel switch animation ──────────────────────────────────────────

function animateVoicePanel() {
    const targets = document.querySelectorAll<HTMLElement>(
        "[class*='voiceUsers_'] > *, [class*='voiceBarContainer_'], [class*='rtcConnectionStatus_']"
    );
    targets.forEach((el, i) => {
        el.animate([
            { opacity: 0, transform: "scale(0.72) translateY(6px)" },
            { opacity: 1, transform: "scale(1) translateY(0)" },
        ], {
            duration: 220,
            delay: i * 28,
            easing: EasingCSS.bouncy,
            fill: "backwards",
        });
    });
}

function onVoiceChannelSelect(_event: any) {
    setTimeout(animateVoicePanel, 90);
}

// ─── Channel drag lift effect ─────────────────────────────────────────────────

const DRAG_STYLE_ID = "swancord-af-drag";
const DRAG_CLASS    = "af-dragging";

const DRAG_CSS = `
.af-dragging {
    opacity: 0.75 !important;
    box-shadow: 0 10px 28px rgba(0,0,0,0.4) !important;
    z-index: 999 !important;
    transition: none !important;
    border-radius: 6px !important;
    cursor: grabbing !important;
}
`;

function onDragStartAF(e: DragEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-list-item-id^='channels___'], [class*='containerDefault_']"
    );
    if (!target) return;
    // Cancel any existing WAAPI before starting a new one
    target.getAnimations().forEach(a => a.cancel());
    target.classList.add(DRAG_CLASS);
    // fill:"none" — the CSS class owns the lifted visual; WAAPI only plays the liftup transition
    target.animate([
        { transform: "scale(1) rotate(0deg)", opacity: 1 },
        { transform: "scale(1.05) rotate(1.5deg)", opacity: 0.75 },
    ], { duration: 130, easing: EasingCSS.snappy, fill: "none" });
}

function onDragEndAF(e: DragEvent) {
    const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-list-item-id^='channels___'], [class*='containerDefault_']"
    );
    if (!target) return;
    target.classList.remove(DRAG_CLASS);
    // Cancel all running WAAPI (clears any fill:forwards from dragstart)
    target.getAnimations().forEach(a => a.cancel());
    // Clear any inline transform/opacity left by a cancelled animation
    target.style.transform = "";
    target.style.opacity = "";
    const anim = target.animate([
        { transform: "scale(1.05) rotate(1.5deg)", opacity: 0.75 },
        { transform: "scale(1) rotate(0deg)",      opacity: 1 },
    ], { duration: 220, easing: EasingCSS.bouncy, fill: "forwards" });
    // Once snap-back finishes, fully clear inline styles so CSS takes over cleanly
    anim.onfinish = () => {
        anim.cancel();
        target.style.transform = "";
        target.style.opacity = "";
    };
}

function injectDragCSS() {
    if (document.getElementById(DRAG_STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = DRAG_STYLE_ID;
    el.textContent = DRAG_CSS;
    document.head.appendChild(el);
}

// ─── Settings ─────────────────────────────────────────────────────────────────

const KINDS_OPTIONS = [
    { label: "Fade",           value: "fade"         },
    { label: "Slide",          value: "slide"        },
    { label: "Scale",          value: "scale"        },
    { label: "Scale + Bounce", value: "scale-bounce" },
    { label: "Flip X",         value: "flip-x"       },
    { label: "Flip Y",         value: "flip-y"       },
    { label: "Rotate",         value: "rotate"       },
    { label: "Wipe",           value: "wipe"         },
    { label: "Grow",           value: "grow"         },
    { label: "Blur",           value: "blur"         },
    { label: "Ripple",         value: "ripple"       },
    { label: "None",           value: "none"         },
] as const;

const EASING_OPTIONS = [
    { label: "Smooth (default)", value: "smooth"  },
    { label: "Snappy",           value: "snappy"  },
    { label: "Bouncy",           value: "bouncy"  },
    { label: "Linear",           value: "linear"  },
    { label: "Elastic",          value: "elastic" },
    { label: "Spring",           value: "spring"  },
] as const;

const DIR_OPTIONS = [
    { label: "Auto (detect forward/backward)", value: "auto"     },
    { label: "Up",                             value: "up"       },
    { label: "Down",                           value: "down"     },
    { label: "Left",                           value: "left"     },
    { label: "Right",                          value: "right"    },
    { label: "Forwards",                       value: "forwards" },
] as const;

const settings = definePluginSettings({
    // ── Global ───────────────────────────────
    duration: {
        type: OptionType.SLIDER,
        description: "Global base animation duration (ms) — each module uses a fraction of this",
        default: 220,
        markers: [60, 100, 140, 180, 220, 280, 350, 450, 600],
        stickToMarkers: false,
    },
    easing: {
        type: OptionType.SELECT,
        description: "Global easing curve (overridden per-module below)",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },
    exitAnimations: {
        type: OptionType.BOOLEAN,
        description: "Animate elements as they disappear — fixed-position clone fades/scales out",
        default: true,
    },
    respectReduceMotion: {
        type: OptionType.BOOLEAN,
        description: "Skip all animations when the OS 'Prefer Reduced Motion' setting is on",
        default: true,
    },
    serverIconHover: {
        type: OptionType.BOOLEAN,
        description: "Scale + rotate server icons on hover",
        default: true,
    },
    channelHoverSlide: {
        type: OptionType.BOOLEAN,
        description: "Slide channel rows right on hover",
        default: true,
    },

    // ── Channel switch ────────────────────────
    channelKind: {
        type: OptionType.SELECT,
        description: "Channel content switch animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 0 })),
    },
    channelDir: {
        type: OptionType.SELECT,
        description: "Channel switch direction (for Slide / Wipe)",
        options: DIR_OPTIONS.map((d, i) => ({ ...d, default: i === 0 })),
    },
    channelEasing: {
        type: OptionType.SELECT,
        description: "Channel switch easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },
    channelDurOverride: {
        type: OptionType.BOOLEAN,
        description: "Override global duration for channel switch",
        default: false,
    },
    channelDur: {
        type: OptionType.NUMBER,
        description: "Channel switch duration override (ms)",
        default: 220,
    },

    // ── Messages ─────────────────────────────
    messageKind: {
        type: OptionType.SELECT,
        description: "New message animation (accordion height + this effect)",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 1 })),
    },
    messageEasing: {
        type: OptionType.SELECT,
        description: "Message animation easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },
    messageViewportOnly: {
        type: OptionType.BOOLEAN,
        description: "Only animate messages visible in the viewport — history scrollback won't trigger animations",
        default: true,
    },
    messageAccordion: {
        type: OptionType.BOOLEAN,
        description: "Accordion expand: new messages slide open from height 0 instead of appearing instantly",
        default: true,
    },

    // ── Modals ────────────────────────────────
    modalKind: {
        type: OptionType.SELECT,
        description: "Modal / sheet animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 2 })),
    },
    modalEasing: {
        type: OptionType.SELECT,
        description: "Modal easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },

    // ── Context menu ──────────────────────────
    contextKind: {
        type: OptionType.SELECT,
        description: "Context menu animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 3 })),
    },
    contextEasing: {
        type: OptionType.SELECT,
        description: "Context menu easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },

    // ── Profile popouts ───────────────────────
    profileKind: {
        type: OptionType.SELECT,
        description: "User profile popout / user card animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 3 })),
    },
    profileEasing: {
        type: OptionType.SELECT,
        description: "Profile easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },

    // ── Sidebars ──────────────────────────────
    sidebarKind: {
        type: OptionType.SELECT,
        description: "Member list / thread sidebar animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 1 })),
    },
    sidebarDir: {
        type: OptionType.SELECT,
        description: "Sidebar slide direction",
        options: DIR_OPTIONS.map((d, i) => ({ ...d, default: i === 4 })),
    },
    sidebarEasing: {
        type: OptionType.SELECT,
        description: "Sidebar easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },

    // ── Tooltips ──────────────────────────────
    tooltipKind: {
        type: OptionType.SELECT,
        description: "Tooltip animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 0 })),
    },

    // ── Settings panel ────────────────────────
    settingsKind: {
        type: OptionType.SELECT,
        description: "Settings / sidebar panel animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 1 })),
    },

    // ── Pickers ───────────────────────────────
    pickerKind: {
        type: OptionType.SELECT,
        description: "Emoji / sticker / GIF picker animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 2 })),
    },

    // ── Autocomplete ──────────────────────────
    autocompleteKind: {
        type: OptionType.SELECT,
        description: "Autocomplete / slash command dropdown animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 1 })),
    },

    // ── Toasts ────────────────────────────────
    toastKind: {
        type: OptionType.SELECT,
        description: "Toast notification animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 1 })),
    },

    // ── DMs ───────────────────────────────────
    dmKind: {
        type: OptionType.SELECT,
        description: "DM / group DM content switch animation",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 9 })), // blur default
    },
    dmEasing: {
        type: OptionType.SELECT,
        description: "DM switch easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 0 })),
    },
    dmDir: {
        type: OptionType.SELECT,
        description: "DM switch direction (for Slide / Wipe)",
        options: DIR_OPTIONS.map((d, i) => ({ ...d, default: i === 0 })),
    },
    dmListAnim: {
        type: OptionType.BOOLEAN,
        description: "Animate the DM list sidebar when switching DMs",
        default: true,
    },

    // ── Send / new message animation ──────────────────────
    sendAnim: {
        type: OptionType.BOOLEAN,
        description: "Play a distinct pop-in animation when a new message appears (yours or others)",
        default: true,
    },
    sendAnimKind: {
        type: OptionType.SELECT,
        description: "New-message / send pop-in animation style",
        options: KINDS_OPTIONS.map((k, i) => ({ ...k, default: i === 3 })), // scale-bounce
    },
    sendAnimEasing: {
        type: OptionType.SELECT,
        description: "Send animation easing",
        options: EASING_OPTIONS.map((e, i) => ({ ...e, default: i === 2 })), // bouncy
    },
});

// ─── Element classifier ───────────────────────────────────────────────────────

type ModuleId =
    | "channel" | "message" | "modal" | "contextMenu" | "profile"
    | "sidebar" | "tooltip" | "settings" | "picker" | "autocomplete" | "toast" | "dm" | "sentMessage";

interface ModuleConfig {
    id: ModuleId;
    /** CSS transform-origin for scale/rotate effects */
    origin: string;
    /** Use accordion (height animation) in addition to kind animation */
    accordion?: boolean;
}

// Ordered: first match wins. Specificity matters.
const MATCHERS: Array<{ test: (el: HTMLElement) => boolean; cfg: ModuleConfig; }> = [
    // Messages — must come before generic containers
    {
        test: el => !!el.id?.startsWith("chat-messages-") || el.className?.includes?.("messageListItem_"),
        cfg: { id: "message", origin: "center top", accordion: true },
    },
    // Context menus
    {
        test: el => (el.getAttribute("role") === "menu" && matchClass(el, "menu_")) || matchClass(el, "contextMenu_"),
        cfg: { id: "contextMenu", origin: "var(--af-menu-origin, top left)" },
    },
    // Tooltips
    {
        test: el => el.getAttribute("role") === "tooltip" || matchClass(el, "tooltipContainer_"),
        cfg: { id: "tooltip", origin: "center bottom" },
    },
    // Autocomplete
    {
        test: el => matchClass(el, "autocomplete_") || matchClass(el, "autocompleteInner_"),
        cfg: { id: "autocomplete", origin: "bottom center" },
    },
    // Toasts
    {
        test: el => matchClass(el, "toast") && matchClass(el, "container_"),
        cfg: { id: "toast", origin: "center center" },
    },
    // Expression / emoji pickers
    {
        test: el => matchClass(el, "emojiPicker_") || matchClass(el, "expressionPicker_") || matchClass(el, "stickerPicker_"),
        cfg: { id: "picker", origin: "bottom right" },
    },
    // Profile popouts / user cards
    {
        test: el => matchClass(el, "userProfileOuter_") || matchClass(el, "profilePanel_") || matchClass(el, "userPopout_"),
        cfg: { id: "profile", origin: "top center" },
    },
    // Modals
    {
        test: el => (el.getAttribute("role") === "dialog") || matchClass(el, "sheet_") || matchClass(el, "sheetModal_"),
        cfg: { id: "modal", origin: "center center" },
    },
    // Sidebars
    {
        test: el => matchClass(el, "membersWrap_") || (matchClass(el, "container_") && matchClass(el, "members_")),
        cfg: { id: "sidebar", origin: "right center" },
    },
    {
        test: el => matchClass(el, "sidebar_") && !matchClass(el, "guilds_"),
        cfg: { id: "sidebar", origin: "right center" },
    },
    // Settings content
    {
        test: el => matchClass(el, "standardSidebarView_") || matchClass(el, "settingsPanel_"),
        cfg: { id: "settings", origin: "right center" },
    },
    // Channel chat area
    {
        test: el => matchClass(el, "messagesWrapper_") || matchClass(el, "chatContent_"),
        cfg: { id: "channel", origin: "center top" },
    },
];

function matchClass(el: HTMLElement, substr: string): boolean {
    return typeof el.className === "string" && el.className.includes(substr);
}

function classify(el: HTMLElement): ModuleConfig | null {
    for (const { test, cfg } of MATCHERS) {
        try { if (test(el)) return cfg; } catch { /* ignore */ }
    }
    return null;
}

// ─── Animation helpers ────────────────────────────────────────────────────────

function ms(n: number): string { return `${n}ms`; }

function getModuleOptions(id: ModuleId): { kind: AnimKind; easing: EasingName; duration: number; dir: string; } {
    const s = settings.store;
    const globalDur = Math.max(40, Math.min(1500, s.duration ?? 220));
    const globalE = (s.easing as EasingName) ?? "smooth";
    const fast  = Math.round(globalDur * 0.68);
    const vfast = Math.round(globalDur * 0.50);

    switch (id) {
        case "channel":
            return {
                kind: (s.channelKind     as AnimKind)    ?? "fade",
                easing: (s.channelEasing as EasingName)  ?? globalE,
                duration: s.channelDurOverride ? Math.max(40, s.channelDur ?? globalDur) : globalDur,
                dir: resolveDir((s.channelDir as string) ?? "auto"),
            };
        case "message":
            return {
                kind: (s.messageKind     as AnimKind)    ?? "slide",
                easing: (s.messageEasing as EasingName)  ?? globalE,
                duration: Math.round(globalDur * 0.55),
                dir: resolveDir((s.channelDir as string) ?? "auto"),
            };
        case "modal":
            return { kind: (s.modalKind as AnimKind) ?? "scale", easing: (s.modalEasing as EasingName) ?? globalE, duration: fast, dir: "up" };
        case "contextMenu":
            return { kind: (s.contextKind as AnimKind) ?? "scale-bounce", easing: (s.contextEasing as EasingName) ?? globalE, duration: vfast, dir: "up" };
        case "profile":
            return { kind: (s.profileKind as AnimKind) ?? "scale-bounce", easing: (s.profileEasing as EasingName) ?? globalE, duration: fast, dir: "up" };
        case "sidebar":
            return { kind: (s.sidebarKind as AnimKind) ?? "slide", easing: (s.sidebarEasing as EasingName) ?? "smooth", duration: fast, dir: resolveDir((s.sidebarDir as string) ?? "right") };
        case "tooltip":
            return { kind: (s.tooltipKind as AnimKind) ?? "fade", easing: globalE, duration: vfast, dir: "up" };
        case "settings":
            return { kind: (s.settingsKind as AnimKind) ?? "slide", easing: globalE, duration: fast, dir: "right" };
        case "picker":
            return { kind: (s.pickerKind as AnimKind) ?? "scale", easing: globalE, duration: fast, dir: "up" };
        case "autocomplete":
            return { kind: (s.autocompleteKind as AnimKind) ?? "slide", easing: globalE, duration: vfast, dir: "up" };
        case "toast":
            return { kind: (s.toastKind as AnimKind) ?? "slide", easing: globalE, duration: vfast, dir: "down" };
        case "dm":
            return {
                kind: (s.dmKind as AnimKind) ?? "blur",
                easing: (s.dmEasing as EasingName) ?? globalE,
                duration: globalDur,
                dir: resolveDir((s.dmDir as string) ?? "auto"),
            };
        case "sentMessage":
            return {
                kind: (s.sendAnimKind as AnimKind) ?? "scale-bounce",
                easing: (s.sendAnimEasing as EasingName) ?? "bouncy",
                duration: Math.round(globalDur * 0.85),
                dir: "up",
            };
    }
}

function shouldSkipReduceMotion(): boolean {
    return !!(settings.store.respectReduceMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// ─── Enter animation ──────────────────────────────────────────────────────────

function animateEnter(el: HTMLElement, cfg: ModuleConfig) {
    if (shouldSkipReduceMotion()) return;
    if (el.getAttribute(ANIMATED_ATTR)) return;
    el.setAttribute(ANIMATED_ATTR, "1");

    const opts = getModuleOptions(cfg.id);
    if (opts.kind === "none") return;

    // Transform origin via CSS var — WAAPI doesn't expose transformOrigin directly
    el.style.transformOrigin = cfg.origin;

    // For accordion messages: animate height before kind animation
    if (cfg.accordion && settings.store.messageAccordion && cfg.id === "message") {
        accordionEnter(el, opts);
        return;
    }

    const frames = enterKeyframes(opts.kind, opts.dir);
    if (!frames.length) return;

    el.animate(frames, {
        duration: opts.duration,
        easing: EasingCSS[opts.easing] ?? EasingCSS.smooth,
        fill: "backwards",
    });
}

function accordionEnter(el: HTMLElement, opts: ReturnType<typeof getModuleOptions>) {
    const naturalHeight = el.scrollHeight;
    if (naturalHeight <= 0) {
        // Height not known yet — wait one frame
        requestAnimationFrame(() => accordionEnter(el, opts));
        return;
    }

    const kindFrames = enterKeyframes(opts.kind, opts.dir);
    const opacityStart = kindFrames[0]?.opacity ?? 0;
    const transformStart = (kindFrames[0] as any)?.transform ?? "none";

    el.style.overflow = "hidden";
    const anim = el.animate([
        { maxHeight: "0px", opacity: opacityStart as number, transform: transformStart as string },
        { maxHeight: `${naturalHeight + 8}px`, opacity: 1, transform: "none" },
    ], {
        duration: opts.duration,
        easing: EasingCSS[opts.easing] ?? EasingCSS.smooth,
        fill: "backwards",
    });

    anim.onfinish = () => {
        el.style.overflow = "";
    };
}

// ─── Exit animation ───────────────────────────────────────────────────────────

function animateExit(el: HTMLElement, cfg: ModuleConfig) {
    if (!settings.store.exitAnimations) return;
    if (shouldSkipReduceMotion()) return;

    const opts = getModuleOptions(cfg.id);
    const frames = exitKeyframes(opts.kind);
    if (!frames.length) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.cssText += `
        position:fixed !important;
        top:${rect.top}px !important;
        left:${rect.left}px !important;
        width:${rect.width}px !important;
        height:${rect.height}px !important;
        margin:0 !important;
        z-index:${EXIT_ZINDEX} !important;
        pointer-events:none !important;
        transform-origin:${cfg.origin};
    `;
    // Prevent exit clone from being animated again
    clone.setAttribute(ANIMATED_ATTR, "exit");

    document.body.appendChild(clone);

    const exitDur = Math.min(opts.duration, 160);
    const anim = clone.animate(frames, {
        duration: exitDur,
        easing: EasingCSS.smooth,
        fill: "forwards",
    });
    anim.onfinish = () => clone.remove();
}

// ─── Intersection Observer (message viewport gating) ─────────────────────────

let intersectionObserver: IntersectionObserver | null = null;
const pendingMessages = new WeakMap<HTMLElement, ModuleConfig>();

function setupIntersectionObserver() {
    intersectionObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target as HTMLElement;
            const cfg = pendingMessages.get(el);
            if (cfg) {
                pendingMessages.delete(el);
                animateEnter(el, cfg);
                intersectionObserver?.unobserve(el);
            }
        }
    }, { threshold: 0.1 });
}

// ─── Main MutationObserver ────────────────────────────────────────────────────

let mainObserver: MutationObserver | null = null;

function onMutation(mutations: MutationRecord[]) {
    for (const m of mutations) {
        // Enter animations
        for (const node of Array.from(m.addedNodes)) {
            if (!(node instanceof HTMLElement)) continue;
            handleAdded(node);
            // Also check children for elements like modals/popouts that are wrapped
            // Limit depth: only walk if the node itself didn't already classify
            if (!classify(node)) {
                node.querySelectorAll<HTMLElement>("*").forEach(child => {
                    if (child.children.length < 15) handleAdded(child);
                });
            }
        }

        // Exit animations
        if (settings.store.exitAnimations) {
            for (const node of Array.from(m.removedNodes)) {
                if (!(node instanceof HTMLElement)) continue;
                handleRemoved(node);
            }
        }
    }
}

function handleAdded(el: HTMLElement) {
    // Skip already-animated, invisible, or exit clones
    if (el.getAttribute(ANIMATED_ATTR)) return;
    if (!el.isConnected) return;
    // Skip if any ancestor was already animated — prevents parent+child double-fire
    if (el.closest(`[${ANIMATED_ATTR}]`)) return;

    const cfg = classify(el);
    if (!cfg) return;

    if (cfg.id === "message" && settings.store.messageViewportOnly && intersectionObserver) {
        // Defer to IntersectionObserver for messages
        pendingMessages.set(el, cfg);
        intersectionObserver.observe(el);
    } else {
        // Small delay for elements that need layout (modals, popouts)
        const needsDelay = ["modal", "profile", "picker", "sidebar"].includes(cfg.id);
        if (needsDelay) {
            setTimeout(() => { if (el.isConnected) animateEnter(el, cfg); }, 16);
        } else {
            animateEnter(el, cfg);
        }
    }
}

function handleRemoved(el: HTMLElement) {
    if (el.getAttribute(ANIMATED_ATTR) === "exit") return;
    const cfg = classify(el);
    if (!cfg) return;
    // Only animate exit on targeted elements (not messages — too many)
    if (["modal", "contextMenu", "profile", "picker", "tooltip", "toast", "sidebar"].includes(cfg.id)) {
        animateExit(el, cfg);
    }
}

// ─── Context menu origin detection ───────────────────────────────────────────

function onContextMenu(e: MouseEvent) {
    const rx = e.clientX / window.innerWidth;
    const ry = e.clientY / window.innerHeight;
    const ox = rx > 0.65 ? "right" : "left";
    const oy = ry > 0.65 ? "bottom" : "top";
    document.documentElement.style.setProperty("--af-menu-origin", `${oy} ${ox}`);
}

// ─── CSS hover effects ────────────────────────────────────────────────────────

function buildHoverCSS(): string {
    const s = settings.store;
    const globalDur = Math.max(40, Math.min(1500, s.duration ?? 220));
    const vfast = Math.round(globalDur * 0.50);
    const EO = EasingCSS.bouncy;
    const parts: string[] = [];

    if (s.serverIconHover) {
        parts.push(`
[class*="listItem_"] [class*="wrapper_"][class*="guild_"],
[class*="blobContainer_"] > * {
    transition: transform ${ms(vfast)} ${EO} !important;
    will-change: transform;
}
[class*="listItem_"]:hover [class*="wrapper_"][class*="guild_"],
[class*="listItem_"]:hover [class*="blobContainer_"] > * {
    transform: scale(1.09) rotate(-3deg) !important;
}
[class*="listItem_"]:active [class*="wrapper_"][class*="guild_"],
[class*="listItem_"]:active [class*="blobContainer_"] > * {
    transform: scale(0.93) !important;
}`);
    }

    if (s.channelHoverSlide) {
        parts.push(`
[class*="modeDefault_"] [class*="link_"],
[class*="link_"][class*="channel_"] {
    transition: padding-left ${ms(vfast)} ${EO}, background ${ms(vfast)} ease !important;
}
[class*="modeDefault_"] [class*="link_"]:hover {
    padding-left: 14px !important;
}`);
    }

    // Smooth badge counter transitions
    parts.push(`
[class*="numberBadge_"],
[class*="badge_"] {
    transition: transform ${ms(vfast)} ${EO}, opacity ${ms(vfast)} ease !important;
}`);

    if (s.respectReduceMotion) {
        parts.push(`
@media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
        animation-duration: 1ms !important;
        transition-duration: 1ms !important;
    }
}`);
    }

    return parts.join("\n");
}

function injectHoverCSS() {
    let el = document.getElementById(HOVER_STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = HOVER_STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = buildHoverCSS();
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "AnimationFriendzy",
    description: "Full Discord animation overhaul using the Web Animations API — 12 independently configurable targets each with their own kind/easing/duration, auto-direction detection, accordion messages, proper exit animations, 11 effect types. By 7n7.",
    authors: [Devs._7n7],
    settings,

    start() {
        injectHoverCSS();
        injectDragCSS();
        setupIntersectionObserver();
        document.addEventListener("contextmenu", onContextMenu, true);
        document.addEventListener("dragstart", onDragStartAF, true);
        document.addEventListener("dragend",   onDragEndAF,   true);
        document.addEventListener("click",     onChannelClickAF, true);
        FluxDispatcher.subscribe("CHANNEL_SELECT",      onChannelSelect);
        FluxDispatcher.subscribe("GUILD_SELECT",        onGuildSelect);
        FluxDispatcher.subscribe("VOICE_CHANNEL_SELECT", onVoiceChannelSelect);
        FluxDispatcher.subscribe("VOICE_STATE_UPDATES", onVoiceChannelSelect);
        FluxDispatcher.subscribe("MESSAGE_CREATE",      onMessageCreate);

        mainObserver = new MutationObserver(onMutation);
        mainObserver.observe(document.body, { childList: true, subtree: true });
    },

    stop() {
        mainObserver?.disconnect();
        mainObserver = null;
        intersectionObserver?.disconnect();
        intersectionObserver = null;
        document.getElementById(HOVER_STYLE_ID)?.remove();
        document.getElementById(DRAG_STYLE_ID)?.remove();
        document.removeEventListener("contextmenu", onContextMenu, true);
        document.removeEventListener("dragstart", onDragStartAF, true);
        document.removeEventListener("dragend",   onDragEndAF,   true);
        document.removeEventListener("click",     onChannelClickAF, true);
        FluxDispatcher.unsubscribe("CHANNEL_SELECT",      onChannelSelect);
        FluxDispatcher.unsubscribe("GUILD_SELECT",        onGuildSelect);
        FluxDispatcher.unsubscribe("VOICE_CHANNEL_SELECT", onVoiceChannelSelect);
        FluxDispatcher.unsubscribe("VOICE_STATE_UPDATES", onVoiceChannelSelect);
        FluxDispatcher.unsubscribe("MESSAGE_CREATE",      onMessageCreate);
        document.documentElement.style.removeProperty("--af-menu-origin");
        // Clean up any stuck exit clones
        document.querySelectorAll(`[${ANIMATED_ATTR}="exit"]`).forEach(el => el.remove());
        // Remove animated markers
        document.querySelectorAll(`[${ANIMATED_ATTR}]`).forEach(el => el.removeAttribute(ANIMATED_ATTR));
        // Clean up drag classes
        document.querySelectorAll(`.${DRAG_CLASS}`).forEach(el => el.classList.remove(DRAG_CLASS));
    },
});
