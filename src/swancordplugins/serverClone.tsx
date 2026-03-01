/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { GuildStore, Menu, RestAPI, Toasts } from "@webpack/common";

// Discord channel types
const CHANNEL_TYPE_CATEGORY = 4;

function mapOverwrites(overwrites: any[], roleIdMap: Record<string, string>): any[] {
    return (overwrites ?? []).map(ow => ({
        // type 0 = role overwrite → remap to new role ID; type 1 = member overwrite → keep as-is
        id: ow.type === 0 ? (roleIdMap[ow.id] ?? ow.id) : ow.id,
        type: ow.type,
        allow: ow.allow,
        deny: ow.deny,
    }));
}

async function cloneServer(guildId: string) {
    const guild = GuildStore.getGuild(guildId);
    if (!guild) return;

    try {
        Toasts.show({
            id: Toasts.genId(),
            message: `Cloning "${guild.name}"…`,
            type: Toasts.Type.MESSAGE,
        });

        // ── 1. Fetch source roles & channels ─────────────────────
        const [rolesRes, channelsRes] = await Promise.all([
            RestAPI.get({ url: `/guilds/${guildId}/roles` }),
            RestAPI.get({ url: `/guilds/${guildId}/channels` }),
        ]);

        const sourceRoles: any[]    = rolesRes.body    ?? [];
        const sourceChannels: any[] = channelsRes.body ?? [];

        // ── 2. Create the new (empty) guild ───────────────────────
        const newGuildRes = await RestAPI.post({
            url: "/guilds",
            body: { name: `${guild.name} (Clone)` },
        });
        const newGuild   = newGuildRes.body;
        const newGuildId: string = newGuild.id;

        // Remove the stub channels Discord auto-creates
        const stubChannels: any[] = newGuild.channels ?? [];
        await Promise.allSettled(
            stubChannels.map((c: any) => RestAPI.del({ url: `/channels/${c.id}` }))
        );

        // ── 3. Fetch the new guild's @everyone role ───────────────
        const newRolesRes = await RestAPI.get({ url: `/guilds/${newGuildId}/roles` });
        const newEveryoneRole = (newRolesRes.body as any[]).find(r => r.name === "@everyone");

        // Role ID map: old ID → new ID
        const roleIdMap: Record<string, string> = {};

        // Patch the @everyone permissions to match the source
        const srcEveryone = sourceRoles.find(r => r.name === "@everyone");
        if (srcEveryone && newEveryoneRole) {
            roleIdMap[srcEveryone.id] = newEveryoneRole.id;
            await RestAPI.patch({
                url: `/guilds/${newGuildId}/roles/${newEveryoneRole.id}`,
                body: { permissions: srcEveryone.permissions },
            }).catch(() => {});
        }

        // ── 4. Create roles (highest position first to preserve hierarchy) ──
        const rolesToCreate = sourceRoles
            .filter(r => r.name !== "@everyone")
            .sort((a, b) => b.position - a.position);

        for (const role of rolesToCreate) {
            try {
                const res = await RestAPI.post({
                    url: `/guilds/${newGuildId}/roles`,
                    body: {
                        name:           role.name,
                        permissions:    role.permissions,
                        color:          role.color,
                        hoist:          role.hoist,
                        mentionable:    role.mentionable,
                        icon:           role.icon          ?? null,
                        unicode_emoji:  role.unicode_emoji ?? null,
                    },
                });
                roleIdMap[role.id] = res.body.id;
            } catch { /* skip individual role failures */ }
        }

        // ── 5. Create channels ────────────────────────────────────
        const categoryIdMap: Record<string, string> = {};

        // Categories first
        const categories = sourceChannels
            .filter(c => c.type === CHANNEL_TYPE_CATEGORY)
            .sort((a, b) => a.position - b.position);

        for (const cat of categories) {
            try {
                const res = await RestAPI.post({
                    url: `/guilds/${newGuildId}/channels`,
                    body: {
                        name:                  cat.name,
                        type:                  CHANNEL_TYPE_CATEGORY,
                        position:              cat.position,
                        permission_overwrites: mapOverwrites(cat.permission_overwrites, roleIdMap),
                    },
                });
                categoryIdMap[cat.id] = res.body.id;
            } catch {}
        }

        // All other channels
        const otherChannels = sourceChannels
            .filter(c => c.type !== CHANNEL_TYPE_CATEGORY)
            .sort((a, b) => a.position - b.position);

        for (const ch of otherChannels) {
            try {
                const body: Record<string, any> = {
                    name:                  ch.name,
                    type:                  ch.type,
                    position:              ch.position,
                    permission_overwrites: mapOverwrites(ch.permission_overwrites, roleIdMap),
                };

                if (ch.parent_id)           body.parent_id           = categoryIdMap[ch.parent_id] ?? undefined;
                if (ch.topic)               body.topic               = ch.topic;
                if (ch.nsfw)                body.nsfw                = ch.nsfw;
                if (ch.bitrate)             body.bitrate             = ch.bitrate;
                if (ch.user_limit)          body.user_limit          = ch.user_limit;
                if (ch.rate_limit_per_user) body.rate_limit_per_user = ch.rate_limit_per_user;
                if (ch.default_auto_archive_duration)
                    body.default_auto_archive_duration = ch.default_auto_archive_duration;

                await RestAPI.post({ url: `/guilds/${newGuildId}/channels`, body });
            } catch {}
        }

        // ── 6. Done ───────────────────────────────────────────────
        showNotification({
            title: "Server Cloned",
            body: `"${guild.name}" was cloned successfully. Check your server list for "${guild.name} (Clone)".`,
        });

    } catch (err: any) {
        showNotification({
            title: "Clone Failed",
            body: err?.message ?? "An unknown error occurred while cloning the server.",
            color: "#f04747",
        });
    }
}

const GuildContextPatch: NavContextMenuPatchCallback = (children, props) => {
    if (!props?.guild) return;

    const group = findGroupChildrenByChildId("leave-guild", children);
    const item = (
        <Menu.MenuItem
            id="sc-clone-server"
            label="Clone Server"
            icon={() => (
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
            )}
            action={() => cloneServer(props.guild.id)}
        />
    );

    if (group) {
        group.push(item);
    } else {
        children.push(<Menu.MenuGroup>{item}</Menu.MenuGroup>);
    }
};

export default definePlugin({
    name: "ServerClone",
    description: "Adds a 'Clone Server' option when right-clicking a server. Copies all roles (with colors, permissions, hoist & mentionable settings) and channels (with permission overwrites) into a brand-new server.",
    authors: [Devs._7n7],

    contextMenus: {
        "guild-context":       GuildContextPatch,
        "guild-header-popout": GuildContextPatch,
    },
});
