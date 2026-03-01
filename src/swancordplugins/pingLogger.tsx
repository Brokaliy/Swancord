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

import { ApplicationCommandInputType } from "@api/Commands";
import * as DataStore from "@api/DataStore";
import { ModalCloseButton, ModalContent, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Button, ChannelStore, FluxDispatcher, Forms, React, UserStore, useState } from "@webpack/common";

const DS_KEY = "PingLogger_v1";
const MAX_PINGS = 200;

interface PingEntry {
    messageId: string;
    channelId: string;
    guildId?: string;
    author: string;
    content: string;
    timestamp: number;
}

async function getPings(): Promise<PingEntry[]> {
    return (await DataStore.get<PingEntry[]>(DS_KEY)) ?? [];
}

async function addPing(p: PingEntry) {
    const all = await getPings();
    const trimmed = [p, ...all].slice(0, MAX_PINGS);
    await DataStore.set(DS_KEY, trimmed);
}

async function clearPings() {
    await DataStore.del(DS_KEY);
}

function mentionsMe(message: any): boolean {
    const me = UserStore.getCurrentUser();
    if (!me) return false;
    if (message.mention_everyone) return true;
    return message.mentions?.some((u: any) => u.id === me.id) ?? false;
}

function onMessageCreate({ message }: any) {
    const me = UserStore.getCurrentUser();
    if (!message?.content || !me || message.author?.id === me.id) return;
    if (!mentionsMe(message)) return;

    const channel = ChannelStore.getChannel(message.channel_id);
    addPing({
        messageId: message.id,
        channelId: message.channel_id,
        guildId: channel?.guild_id,
        author: message.author?.username ?? "Unknown",
        content: message.content,
        timestamp: Date.now(),
    });
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function PingLogModal({ props }: { props: ModalProps; }) {
    const [pings, setPings] = useState<PingEntry[]>([]);

    React.useEffect(() => {
        getPings().then(setPings);
    }, []);

    async function clear() {
        await clearPings();
        setPings([]);
    }

    return (
        <ModalRoot {...props} size="large">
            <ModalHeader>
                <Forms.FormTitle tag="h4" style={{ margin: 0, flex: 1 }}>Ping Log ({pings.length})</Forms.FormTitle>
                <Button size={Button.Sizes.TINY} color={Button.Colors.RED} look={Button.Looks.OUTLINED} onClick={clear} style={{ marginRight: 8 }}>
                    Clear All
                </Button>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent style={{ padding: "16px" }}>
                {pings.length === 0 ? (
                    <Forms.FormText style={{ opacity: 0.5 }}>No pings logged yet.</Forms.FormText>
                ) : pings.map(p => {
                    const jumpUrl = p.guildId
                        ? `https://discord.com/channels/${p.guildId}/${p.channelId}/${p.messageId}`
                        : `https://discord.com/channels/@me/${p.channelId}/${p.messageId}`;

                    return (
                        <div key={p.messageId} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "10px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ flex: 1 }}>
                                <Forms.FormText style={{ fontWeight: 600, marginBottom: 2 }}>
                                    {p.author} &middot; <span style={{ opacity: 0.45, fontSize: "0.78rem" }}>{new Date(p.timestamp).toLocaleString()}</span>
                                </Forms.FormText>
                                <Forms.FormText style={{ opacity: 0.8, lineHeight: 1.5 }}>{p.content}</Forms.FormText>
                            </div>
                            <Button size={Button.Sizes.TINY} look={Button.Looks.OUTLINED} onClick={() => window.open(jumpUrl, "_blank")}>Jump</Button>
                        </div>
                    );
                })}
            </ModalContent>
        </ModalRoot>
    );
}

export default definePlugin({
    name: "PingLogger",
    description: "Logs all messages that mention you (up to 200). Use /pings to review them.",
    authors: [Devs._7n7],

    commands: [
        {
            name: "pings",
            description: "View your recent ping log",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async () => {
                openModal(props => <PingLogModal props={props} />);
            },
        },
    ],

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessageCreate);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessageCreate);
    },
});
