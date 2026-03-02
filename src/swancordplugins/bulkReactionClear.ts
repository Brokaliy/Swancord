/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "BulkReactionClear",
    description: "Adds a 'Remove all my reactions' button to message context menus, removing every reaction you added to a message in one click.",
    authors: [Devs._7n7],

    contextMenus: {
        "message"(children: any[], props: any) {
            const messageId: string = props?.message?.id;
            const channelId: string = props?.channel?.id;
            if (!messageId || !channelId) return;

            const { React } = globalThis;
            if (!React) return;

            const myReactions: string[] = Object.entries(
                (props?.message?.reactions ?? [])
            )
                // reactions is an array of reaction objects
                .map(([, r]: [any, any]) => r)
                .filter((r: any) => r?.me)
                .map((r: any) => r?.emoji?.name ?? r?.emoji?.id);

            if (!myReactions.length) return;

            children.push(
                React.createElement("div", {
                    key: "bulk-reaction-clear",
                    ...(window as any).BdApi?.React ? {} : {},
                }),
                {
                    type: "button",
                    label: `Remove my ${myReactions.length} reaction${myReactions.length !== 1 ? "s" : ""}`,
                    action: async () => {
                        for (const emoji of myReactions) {
                            try {
                                await (globalThis as any).Vencord?.Webpack?.Common?.RestAPI?.del({
                                    url: `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}/@me`,
                                });
                            } catch { /* ignore individual failures */ }
                        }
                    },
                    id: "swancord-bulk-reaction-clear",
                    icon: void 0,
                } as any
            );
        },
    },

    start() {},
    stop() {},
});
