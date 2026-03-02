/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { GuildStore, RestAPI, Toasts, UserStore } from "@webpack/common";

const CONTEXT_ITEM_ID = "swancord-nick-sync";

function buildContextMenu() {
    // Injected via message context menu — we add it to guild context menus
}

async function syncNickToAll(currentGuildId: string, nick: string) {
    const guilds = Object.keys((GuildStore as any).getGuilds?.() ?? {});
    let success = 0;
    let failed = 0;

    for (const guildId of guilds) {
        if (guildId === currentGuildId) continue;
        try {
            const me = UserStore.getCurrentUser?.();
            if (!me) continue;
            await RestAPI.patch({
                url: `/guilds/${guildId}/members/@me`,
                body: { nick },
            });
            success++;
        } catch {
            failed++;
        }
        // Rate-limit friendly delay
        await new Promise(r => setTimeout(r, 350));
    }

    Toasts.show({
        message: `✅ Nick synced to ${success} servers${failed > 0 ? ` (${failed} failed)` : ""}`,
        type: failed > 0 ? Toasts.Type.FAILURE : Toasts.Type.MESSAGE,
        id: Toasts.genId(),
        options: { duration: 5000 },
    });
}

function onContextMenu(e: MouseEvent) {
    // Look for guild icon right-clicks
    const target = e.target as HTMLElement;
    const guildEl = target.closest<HTMLElement>("[class*='listItem_'] [data-dnd-name]");
    if (!guildEl) return;

    const guildId = (guildEl as any).__reactFiber?.return?.stateNode?.props?.guild?.id
        ?? (guildEl.closest("[data-list-item-id]") as any)
            ?.dataset?.listItemId?.replace("guildsnav___", "");
    if (!guildId) return;

    // Add our menu item to the existing context menu
    setTimeout(() => {
        const menu = document.querySelector<HTMLElement>("[class*='menu_'][role='menu']");
        if (!menu || menu.querySelector(`#${CONTEXT_ITEM_ID}`)) return;

        const divider = document.createElement("div");
        divider.style.cssText = "border-top:1px solid var(--background-modifier-accent);margin:4px 0;";
        menu.appendChild(divider);

        const btn = document.createElement("div");
        btn.id = CONTEXT_ITEM_ID;
        btn.role = "menuitem";
        btn.textContent = "📋 Sync nickname to all servers";
        btn.style.cssText = "padding:6px 12px;cursor:pointer;color:var(--text-normal);font-size:14px;border-radius:4px;";
        btn.addEventListener("mouseenter", () => { btn.style.background = "var(--brand-500,#5865f2)"; btn.style.color = "#fff"; });
        btn.addEventListener("mouseleave", () => { btn.style.background = ""; btn.style.color = "var(--text-normal)"; });
        btn.addEventListener("click", async () => {
            menu.remove();
            const me = UserStore.getCurrentUser?.();
            if (!me) return;
            // Get current nick for this guild
            const members = (GuildStore as any).getGuildMember?.(guildId, me.id);
            const nick = members?.nick ?? me.username;
            await syncNickToAll(guildId, nick);
        });
        menu.appendChild(btn);
    }, 50);
}

export default definePlugin({
    name: "ServerNickSync",
    description: "Right-click a server icon → sync your nickname from that server to all other servers.",
    authors: [Devs._7n7],

    start() {
        document.addEventListener("contextmenu", onContextMenu, true);
    },

    stop() {
        document.removeEventListener("contextmenu", onContextMenu, true);
        document.getElementById(CONTEXT_ITEM_ID)?.remove();
    },
});
