/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher, GuildMemberStore, RestAPI, Toasts, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    deleteMessageDays: {
        type: OptionType.SELECT,
        description: "How many days of messages to delete on quick ban",
        options: [
            { label: "None (0 days)", value: 0, default: true },
            { label: "1 day",         value: 1 },
            { label: "7 days",        value: 7 },
        ],
    },
});

async function quickBan(guildId: string, userId: string) {
    const me = UserStore.getCurrentUser?.();
    if (me?.id === userId) {
        Toasts.show({ id: Toasts.genId(), message: "You can't ban yourself.", type: Toasts.Type.FAILURE });
        return;
    }

    try {
        await RestAPI.put({
            url: `/guilds/${guildId}/bans/${userId}`,
            body: { delete_message_seconds: settings.store.deleteMessageDays * 86400 },
        });
        const username = GuildMemberStore.getMember(guildId, userId)?.nick
            ?? UserStore.getUser?.(userId)?.username
            ?? userId;
        Toasts.show({ id: Toasts.genId(), message: `Banned ${username}.`, type: Toasts.Type.SUCCESS });
    } catch (err: any) {
        showNotification({
            title: "Quick Ban Failed",
            body: err?.body?.message ?? err?.message ?? "Insufficient permissions.",
            color: "#f04747",
        });
    }
}

const UserContextPatch: NavContextMenuPatchCallback = (children, props) => {
    const { user, guildId } = props ?? {};
    if (!user || !guildId) return;

    const group = findGroupChildrenByChildId("ban", children);
    const item = (
        <Menu.MenuItem
            id="sc-quick-ban"
            label="Quick Ban"
            color="danger"
            action={() => quickBan(guildId, user.id)}
        />
    );

    if (group) group.push(item);
    else children.push(<Menu.MenuGroup>{item}</Menu.MenuGroup>);
};

export default definePlugin({
    name: "QuickBan",
    description: "Adds a 'Quick Ban' option to the user context menu that bans without a confirmation dialog.",
    authors: [Devs._7n7],
    settings,

    contextMenus: {
        "user-context": UserContextPatch,
    },
});
