/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage } from "@api/Commands";
import * as DataStore from "@api/DataStore";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Button, Forms, Menu, React, useState } from "@webpack/common";

const DS_KEY = "MessageBookmarks_v1";

interface Bookmark {
    id: string;
    channelId: string;
    guildId?: string;
    author: string;
    content: string;
    timestamp: number;
    jumpUrl: string;
}

async function getBookmarks(): Promise<Bookmark[]> {
    return (await DataStore.get<Bookmark[]>(DS_KEY)) ?? [];
}

async function addBookmark(bm: Bookmark) {
    const all = await getBookmarks();
    if (all.some(b => b.id === bm.id)) return false;
    await DataStore.set(DS_KEY, [bm, ...all]);
    return true;
}

async function removeBookmark(id: string) {
    const all = await getBookmarks();
    await DataStore.set(DS_KEY, all.filter(b => b.id !== id));
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function BookmarksModal({ props }: { props: ModalProps; }) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

    React.useEffect(() => {
        getBookmarks().then(setBookmarks);
    }, []);

    async function remove(id: string) {
        await removeBookmark(id);
        setBookmarks(prev => prev.filter(b => b.id !== id));
    }

    return (
        <ModalRoot {...props} size="large">
            <ModalHeader>
                <Forms.FormTitle tag="h4" style={{ margin: 0, flex: 1 }}>Bookmarks</Forms.FormTitle>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent style={{ padding: "16px" }}>
                {bookmarks.length === 0 ? (
                    <Forms.FormText style={{ opacity: 0.5 }}>
                        No bookmarks yet. Right-click any message and choose &quot;Bookmark Message&quot;.
                    </Forms.FormText>
                ) : bookmarks.map(bm => (
                    <div
                        key={bm.id}
                        style={{
                            borderBottom: "1px solid rgba(255,255,255,0.07)",
                            padding: "10px 0",
                            display: "flex",
                            gap: 10,
                            alignItems: "flex-start",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <Forms.FormText style={{ fontWeight: 600, marginBottom: 2 }}>
                                {bm.author} &middot; <span style={{ opacity: 0.45, fontSize: "0.78rem" }}>{new Date(bm.timestamp).toLocaleString()}</span>
                            </Forms.FormText>
                            <Forms.FormText style={{ opacity: 0.8, lineHeight: 1.5 }}>
                                {bm.content || "(no text)"}
                            </Forms.FormText>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <Button
                                size={Button.Sizes.TINY}
                                look={Button.Looks.OUTLINED}
                                onClick={() => window.open(bm.jumpUrl, "_blank")}
                            >
                                Jump
                            </Button>
                            <Button
                                size={Button.Sizes.TINY}
                                color={Button.Colors.RED}
                                look={Button.Looks.OUTLINED}
                                onClick={() => remove(bm.id)}
                            >
                                ✕
                            </Button>
                        </div>
                    </div>
                ))}
            </ModalContent>
        </ModalRoot>
    );
}

// ── Context menu patch ─────────────────────────────────────────────────────────

const patchMessageMenu: NavContextMenuPatchCallback = (children, { message, channel }) => {
    if (!message) return;
    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    group.push(
        <Menu.MenuItem
            id="bookmark-message"
            key="bookmark-message"
            label="Bookmark Message"
            action={async () => {
                const guildId = (channel as any)?.guild_id;
                const jumpUrl = guildId
                    ? `https://discord.com/channels/${guildId}/${channel.id}/${message.id}`
                    : `https://discord.com/channels/@me/${channel.id}/${message.id}`;

                const ok = await addBookmark({
                    id: message.id,
                    channelId: channel.id,
                    guildId,
                    author: message.author?.username ?? "Unknown",
                    content: message.content ?? "",
                    timestamp: Date.now(),
                    jumpUrl,
                });
                if (!ok) sendBotMessage(channel.id, { content: "Already bookmarked." });
            }}
        />
    );
};

// ── Plugin ─────────────────────────────────────────────────────────────────────

export default definePlugin({
    name: "MessageBookmarks",
    description: "Right-click any message to bookmark it. Use /bookmarks to view saved bookmarks.",
    authors: [Devs._7n7],

    contextMenus: {
        "message": patchMessageMenu,
    },

    commands: [
        {
            name: "bookmarks",
            description: "View your saved message bookmarks",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async () => {
                openModal(props => <BookmarksModal props={props} />);
            },
        },
    ],
});
