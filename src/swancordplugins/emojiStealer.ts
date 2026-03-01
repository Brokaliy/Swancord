/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { GuildStore, RestAPI, Toasts, UserStore } from "@webpack/common";

const EMOJI_RE = /<(a?):([^:>]+):(\d+)>/g;

function parseEmoji(src: string): { animated: boolean; name: string; id: string; } | null {
    EMOJI_RE.lastIndex = 0;
    const m = EMOJI_RE.exec(src);
    if (!m) return null;
    return { animated: m[1] === "a", name: m[2], id: m[3] };
}

const settings = definePluginSettings({
    targetGuildId: {
        type: OptionType.STRING,
        description: "Guild ID to steal emojis into (must be a server you manage)",
        default: "",
    },
});

async function stealFromElement(el: Element) {
    const targetGuildId = settings.store.targetGuildId.trim();
    if (!targetGuildId) {
        Toasts.show({ id: Toasts.genId(), message: "Set a target guild ID in EmojiStealer settings first.", type: Toasts.Type.FAILURE });
        return;
    }
    // <img> emoji with src containing /emojis/<id>
    const src = (el as HTMLImageElement).src ?? "";
    const idMatch = src.match(/\/emojis\/(\d+)/);
    if (!idMatch) return;
    const emojiId = idMatch[1];
    const animated = src.includes(".gif");
    const name = (el as HTMLElement).alt?.replace(/:/g, "").trim() || "stolen";

    try {
        const img = await fetch(`https://cdn.discordapp.com/emojis/${emojiId}.${animated ? "gif" : "png"}?size=128`);
        const blob = await img.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise(res => { reader.onloadend = () => res(reader.result as string); reader.readAsDataURL(blob); });
        await RestAPI.post({ url: `/guilds/${targetGuildId}/emojis`, body: { name, image: dataUrl, roles: [] } });
        Toasts.show({ id: Toasts.genId(), message: `Emoji :${name}: stolen!`, type: Toasts.Type.SUCCESS });
    } catch (err: any) {
        showNotification({ title: "Emoji Steal Failed", body: err?.body?.message ?? err?.message ?? "Unknown error", color: "#f04747" });
    }
}

function onClick(e: MouseEvent) {
    if (!e.altKey) return;
    const target = e.target as Element;
    const img = target.closest("img[src*=\"/emojis/\"]") as HTMLImageElement | null;
    if (!img) return;
    e.preventDefault();
    e.stopPropagation();
    stealFromElement(img);
}

export default definePlugin({
    name: "EmojiStealer",
    description: "Alt+click any custom emoji in chat to steal it into the guild ID set in settings.",
    authors: [Devs._7n7],
    settings,

    start() { document.addEventListener("click", onClick, true); },
    stop()  { document.removeEventListener("click", onClick, true); },
});
