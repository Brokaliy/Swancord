/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { GuildStore, Menu, RestAPI } from "@webpack/common";

// Discord channel types
const CHANNEL_TYPE_CATEGORY = 4;
const CHANNEL_TYPE_VOICE    = 2;
const CHANNEL_TYPE_STAGE    = 13;
const CHANNEL_TYPE_FORUM    = 15;
const CHANNEL_TYPE_MEDIA    = 16;
// Delay between sequential API calls to avoid hitting rate limits
const API_DELAY = 300; // ms

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

function mapOverwrites(overwrites: any[], roleIdMap: Record<string, string>): any[] {
    return (overwrites ?? []).map(ow => ({
        id: ow.type === 0 ? (roleIdMap[ow.id] ?? ow.id) : ow.id,
        type: ow.type,
        allow: String(ow.allow ?? "0"),
        deny:  String(ow.deny  ?? "0"),
    }));
}

function fmtSeconds(s: number): string {
    if (s < 60) return `~${s}s`;
    return `~${Math.ceil(s / 60)}m`;
}

async function cloneServer(guildId: string) {
    const guild = GuildStore.getGuild(guildId);
    if (!guild) return;

    try {
        // ── 1. Fetch source roles & channels ─────────────────────
        const [rolesRes, channelsRes] = await Promise.all([
            RestAPI.get({ url: `/guilds/${guildId}/roles` }),
            RestAPI.get({ url: `/guilds/${guildId}/channels` }),
        ]);

        const sourceRoles: any[]    = rolesRes.body    ?? [];
        const sourceChannels: any[] = channelsRes.body ?? [];

        // Estimate: each role/channel = ~API_DELAY ms, plus guild creation overhead
        const totalSteps = sourceRoles.filter(r => r.name !== "@everyone").length + sourceChannels.length;
        const estimatedSecs = Math.ceil((totalSteps * API_DELAY + 3000) / 1000);

        showNotification({
            title: `Cloning "${guild.name}"`,
            body: `Starting clone — ${sourceRoles.length - 1} roles, ${sourceChannels.length} channels. Estimated time: ${fmtSeconds(estimatedSecs)}. You'll get a notification when done.`,
        });

        // ── 2. Create the new (empty) guild ───────────────────────
        const newGuildRes = await RestAPI.post({
            url: "/guilds",
            body: { name: `${guild.name} (Clone)` },
        });
        const newGuild   = newGuildRes.body;
        const newGuildId: string = newGuild.id;

        // Wait for Discord to fully provision the guild before touching it
        await sleep(1500);

        // Fetch and delete the stub channels Discord auto-creates
        const stubRes = await RestAPI.get({ url: `/guilds/${newGuildId}/channels` }).catch(() => ({ body: [] }));
        const stubChannels: any[] = stubRes.body ?? [];
        for (const c of stubChannels) {
            await RestAPI.del({ url: `/channels/${c.id}` }).catch(() => {});
            await sleep(200);
        }

        // ── 3. Fetch the new guild's @everyone role ───────────────
        const newRolesRes = await RestAPI.get({ url: `/guilds/${newGuildId}/roles` });
        const newEveryoneRole = (newRolesRes.body as any[]).find(r => r.name === "@everyone");

        const roleIdMap: Record<string, string> = {};

        const srcEveryone = sourceRoles.find(r => r.name === "@everyone");
        if (srcEveryone && newEveryoneRole) {
            roleIdMap[srcEveryone.id] = newEveryoneRole.id;
            await RestAPI.patch({
                url: `/guilds/${newGuildId}/roles/${newEveryoneRole.id}`,
                body: { permissions: String(srcEveryone.permissions) },
            }).catch(() => {});
        }

        // ── 4. Create roles — lowest position first so hierarchy is correct ──
        // Discord position 1 = highest displayed; we create bottom-up so each
        // new role ends up at the top, preserving the original order.
        const rolesToCreate = sourceRoles
            .filter(r => r.name !== "@everyone")
            .sort((a, b) => a.position - b.position); // ascending = bottom first

        for (const role of rolesToCreate) {
            try {
                await sleep(API_DELAY);
                const res = await RestAPI.post({
                    url: `/guilds/${newGuildId}/roles`,
                    body: {
                        name:          role.name,
                        permissions:   String(role.permissions),
                        color:         role.color,
                        hoist:         role.hoist,
                        mentionable:   role.mentionable,
                        // icon/unicode_emoji require ROLE_ICONS feature — skip silently if unsupported
                        ...(role.unicode_emoji ? { unicode_emoji: role.unicode_emoji } : {}),
                    },
                });
                roleIdMap[role.id] = res.body.id;
            } catch { /* role may fail (e.g. missing feature flags) — skip */ }
        }

        // ── 5. Create channels ────────────────────────────────────
        const categoryIdMap: Record<string, string> = {};

        // Sort by position to preserve visual order — do NOT pass position in
        // the body; let Discord assign positions sequentially on creation.
        const categories = sourceChannels
            .filter(c => c.type === CHANNEL_TYPE_CATEGORY)
            .sort((a, b) => a.position - b.position);

        for (const cat of categories) {
            try {
                await sleep(API_DELAY);
                const res = await RestAPI.post({
                    url: `/guilds/${newGuildId}/channels`,
                    body: {
                        name:                  cat.name,
                        type:                  CHANNEL_TYPE_CATEGORY,
                        permission_overwrites: mapOverwrites(cat.permission_overwrites ?? [], roleIdMap),
                    },
                });
                categoryIdMap[cat.id] = res.body.id;
            } catch {}
        }

        // Non-category channels, sorted by parent position then own position
        const otherChannels = sourceChannels
            .filter(c => c.type !== CHANNEL_TYPE_CATEGORY)
            .sort((a, b) => {
                const aCat = a.parent_id ? (sourceChannels.find((x: any) => x.id === a.parent_id)?.position ?? 0) : -1;
                const bCat = b.parent_id ? (sourceChannels.find((x: any) => x.id === b.parent_id)?.position ?? 0) : -1;
                return aCat !== bCat ? aCat - bCat : a.position - b.position;
            });

        for (const ch of otherChannels) {
            try {
                await sleep(API_DELAY);
                const body: Record<string, any> = {
                    name:                  ch.name,
                    type:                  ch.type,
                    permission_overwrites: mapOverwrites(ch.permission_overwrites ?? [], roleIdMap),
                };

                // Only set parent_id if the category was successfully cloned
                const newParent = ch.parent_id ? categoryIdMap[ch.parent_id] : undefined;
                if (newParent) body.parent_id = newParent;

                // ── Fields shared by text / announcement / forum / media ──
                if (ch.topic)               body.topic               = ch.topic;
                if (ch.nsfw)                body.nsfw                = ch.nsfw;
                if (ch.rate_limit_per_user) body.rate_limit_per_user = ch.rate_limit_per_user;
                if (ch.default_auto_archive_duration)
                    body.default_auto_archive_duration = ch.default_auto_archive_duration;
                if (ch.default_thread_rate_limit_per_user)
                    body.default_thread_rate_limit_per_user = ch.default_thread_rate_limit_per_user;

                // ── Voice / Stage fields ──
                const isVoiceLike = [
                    CHANNEL_TYPE_VOICE, CHANNEL_TYPE_STAGE
                ].includes(ch.type);
                if (isVoiceLike) {
                    if (ch.bitrate)            body.bitrate            = ch.bitrate;
                    if (ch.user_limit)         body.user_limit         = ch.user_limit;
                    if (ch.rtc_region)         body.rtc_region         = ch.rtc_region;
                    if (ch.video_quality_mode) body.video_quality_mode = ch.video_quality_mode;
                }

                // ── Forum / Media channel fields ──
                const isForumLike = [
                    CHANNEL_TYPE_FORUM, CHANNEL_TYPE_MEDIA
                ].includes(ch.type);
                if (isForumLike) {
                    if (ch.available_tags?.length) {
                        // Strip IDs so Discord generates new ones
                        body.available_tags = ch.available_tags.map((t: any) => ({
                            name:       t.name,
                            moderated:  t.moderated ?? false,
                            emoji_id:   t.emoji_id   ?? null,
                            emoji_name: t.emoji_name ?? null,
                        }));
                    }
                    if (ch.default_reaction_emoji)
                        body.default_reaction_emoji = ch.default_reaction_emoji;
                    if (ch.default_sort_order != null)
                        body.default_sort_order = ch.default_sort_order;
                    if (ch.default_forum_layout != null)
                        body.default_forum_layout = ch.default_forum_layout;
                }

                // ── Announcement channel ──
                // type stays as ANNOUNCEMENT; Discord handles follow relationships separately

                await RestAPI.post({ url: `/guilds/${newGuildId}/channels`, body });
            } catch {}
        }

        // ── 6. Done ───────────────────────────────────────────────
        showNotification({
            title: "✓ Server Cloned",
            body: `"${guild.name}" cloned successfully → "${guild.name} (Clone)" is now in your server list.`,
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
