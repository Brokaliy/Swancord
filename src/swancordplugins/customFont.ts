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

const STYLE_ID = "swancord-custom-font";

const settings = definePluginSettings({
    fontFamily: {
        type: OptionType.STRING,
        description: "Font family to use across Discord (e.g. 'Inter', 'JetBrains Mono', 'Roboto'). Leave blank to restore Discord's default.",
        default: "",
        onChange: applyFont,
    },
});

function applyFont() {
    const font = settings.store.fontFamily?.trim();
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

    if (!font) {
        el?.remove();
        return;
    }

    if (!el) {
        el = document.createElement("style") as HTMLStyleElement;
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }

    el.textContent = `
        :root {
            --font-primary: ${JSON.stringify(font)}, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
            --font-display: ${JSON.stringify(font)}, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
        }
        body, [class] { font-family: ${JSON.stringify(font)}, "gg sans", "Noto Sans", Helvetica, Arial, sans-serif !important; }
    `;
}

export default definePlugin({
    name: "CustomFont",
    description: "Override Discord's font with any font installed on your system. Set the font name in plugin settings.",
    authors: [Devs._7n7],
    settings,

    start() {
        applyFont();
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
