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
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

// Remote banners: maps userId -> bannerUrl
// Managed at 7n7.dev/swancord/banners.json
// To get your banner added, ask in the Swancord server
const BANNERS_URL = "https://7n7.dev/swancord/banners.json";

const settings = definePluginSettings({
    bannerUrl: {
        type: OptionType.STRING,
        description: "Your custom profile banner URL (shown only to you — submit to the Swancord server to show to everyone)",
        default: "",
        placeholder: "https://example.com/banner.png",
    },
    nitroFirst: {
        type: OptionType.BOOLEAN,
        description: "Use real Nitro banner instead of custom banner if both are present",
        default: true,
    },
});

export default definePlugin({
    name: "FakeBanner",
    description: "Show a custom profile banner on your profile. Other Swancord users can also see banners submitted to the Swancord server.",
    authors: [Devs._7n7],
    settings,

    remoteBanners: {} as Record<string, string>,

    patches: [
        {
            find: ':"SHOULD_LOAD");',
            replacement: {
                match: /\i(?:\?)?.getPreviewBanner\(\i,\i,\i\)(?=.{0,100}"COMPLETE")/,
                replace: "$self.patchBannerUrl(arguments[0])||$&",
            },
        },
    ],

    patchBannerUrl({ displayProfile }: any) {
        if (!displayProfile?.userId) return null;

        if (displayProfile.banner && settings.store.nitroFirst) return null;

        // Check remote banners first (for other users)
        const remote = this.remoteBanners[displayProfile.userId];
        if (remote) return remote;

        // Check local setting (for the current user's own profile preview)
        if (settings.store.bannerUrl?.trim()) return settings.store.bannerUrl.trim();

        return null;
    },

    async start() {
        await this.loadRemoteBanners();
        setInterval(() => this.loadRemoteBanners(), 1000 * 60 * 30);
    },

    async loadRemoteBanners() {
        try {
            const res = await fetch(BANNERS_URL);
            if (res.ok) this.remoteBanners = await res.json();
        } catch {
            // silently fail — remote banners are optional
        }
    },
});
