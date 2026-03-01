/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2024 7n7 and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Toasts } from "@webpack/common";

const settings = definePluginSettings({
    maxSizeMB: {
        type: OptionType.NUMBER,
        description: "Warn before uploading a file larger than this many MB (0 = disabled)",
        default: 8,
    },
    block: {
        type: OptionType.BOOLEAN,
        description: "Block the upload entirely instead of just warning",
        default: false,
    },
});

export default definePlugin({
    name: "LargeFileWarning",
    description: "Shows a warning (or blocks) when you try to upload a file over a configurable size limit.",
    authors: [Devs._7n7],
    dependencies: ["MessageEventsAPI"],
    settings,

    onBeforeMessageSend(_channelId: string, _msg: any, options: any) {
        const maxBytes = settings.store.maxSizeMB * 1024 * 1024;
        if (!maxBytes) return;

        const uploads: any[] = options?.uploads ?? [];
        const large = uploads.filter(u => (u?.item?.size ?? u?.size ?? 0) > maxBytes);
        if (!large.length) return;

        const names = large.map(u => u?.filename ?? u?.item?.name ?? "file").join(", ");
        const label = `⚠️ Large upload: ${names} exceeds ${settings.store.maxSizeMB} MB`;

        Toasts.show({
            message: label,
            type: Toasts.Type.FAILURE,
            id: Toasts.genId(),
            options: { duration: 5000 },
        });

        if (settings.store.block) return { cancel: true };
    },
});
