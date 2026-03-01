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

import { definePluginSettings } from "@api/Settings";
import { MessageObject } from "@api/MessageEvents";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    ending: {
        type: OptionType.STRING,
        description: "Text to append to every message (max 10 characters)",
        default: " :3",
        onChange(value: string) {
            // Silently trim to 10 chars if the user somehow pastes more
            if (value.length > 10) settings.store.ending = value.slice(0, 10);
        },
    },
});

export default definePlugin({
    name: "CustomEnding",
    description: "Appends a custom suffix (up to 10 characters) to the end of every message you send. Configure it in the plugin settings.",
    authors: [Devs.ujc2],
    settings,

    onBeforeMessageSend(_channelId: string, msg: MessageObject) {
        if (!msg.content) return;
        const suffix = (settings.store.ending ?? "").slice(0, 10);
        if (!suffix) return;
        msg.content += suffix;
    },
});
