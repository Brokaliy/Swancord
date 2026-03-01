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

import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { FluxDispatcher } from "@webpack/common";

const logger = new Logger("NitroSniper");

const TokenStore = findByPropsLazy("getToken");

const GIFT_REGEX = /(?:discord\.gift|discord\.com\/gifts|discordapp\.com\/gifts)\/([a-zA-Z0-9]+)/g;

const sniped = new Set<string>();

async function tryRedeem(code: string) {
    if (sniped.has(code)) return;
    sniped.add(code);

    const token = TokenStore.getToken();
    if (!token) return;

    try {
        const res = await fetch(`https://discord.com/api/v9/entitlements/gift-codes/${code}/redeem`, {
            method: "POST",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ channel_id: null, payment_source_id: null }),
        });

        const data = await res.json();

        if (res.ok) {
            showNotification({
                title: "Nitro Sniped!",
                body: `Successfully redeemed gift code ${code}.`,
                color: "#6d28d9",
            });
            logger.info("Sniped code:", code, data);
        } else {
            const msg: Record<number, string> = {
                400: "Already redeemed or invalid code.",
                404: "Code not found / expired.",
                429: "Rate limited — try again later.",
            };
            showNotification({
                title: "Snipe Failed",
                body: msg[res.status] ?? `Error ${res.status}: ${data?.message ?? "unknown"}`,
                color: "#ef4444",
            });
            logger.warn("Snipe failed:", res.status, data);
        }
    } catch (e) {
        logger.error("Fetch error:", e);
    }
}

function onMessage({ message }: { message: { content?: string; }; }) {
    if (!message?.content) return;
    const matches = [...message.content.matchAll(GIFT_REGEX)];
    for (const m of matches) tryRedeem(m[1]);
}

export default definePlugin({
    name: "NitroSniper",
    description: "Automatically redeems Discord Nitro gift links the moment they appear in any message.",
    authors: [Devs._7n7],

    start() {
        FluxDispatcher.subscribe("MESSAGE_CREATE", onMessage);
    },

    stop() {
        FluxDispatcher.unsubscribe("MESSAGE_CREATE", onMessage);
        sniped.clear();
    },
});
