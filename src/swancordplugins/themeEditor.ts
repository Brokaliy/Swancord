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

const STYLE_ID = "swancord-theme-editor";

// All variables that can be overridden. Leave blank = use Discord default.
const VARS: Array<{ key: keyof typeof settings.store; cssVar: string; label: string; }> = [
    { key: "bgPrimary",       cssVar: "--background-primary",         label: "Background Primary" },
    { key: "bgSecondary",     cssVar: "--background-secondary",       label: "Background Secondary" },
    { key: "bgTertiary",      cssVar: "--background-tertiary",        label: "Background Tertiary" },
    { key: "bgFloating",      cssVar: "--background-floating",        label: "Background Floating (popups)" },
    { key: "bgModifierHover", cssVar: "--background-modifier-hover",  label: "Hover Highlight" },
    { key: "textNormal",      cssVar: "--text-normal",                label: "Text Normal" },
    { key: "textMuted",       cssVar: "--text-muted",                 label: "Text Muted" },
    { key: "textLink",        cssVar: "--text-link",                  label: "Links" },
    { key: "accent",          cssVar: "--brand-500",                  label: "Accent / Blurple" },
    { key: "accentNew",       cssVar: "--brand-560",                  label: "Accent Hover" },
    { key: "channelIcon",     cssVar: "--channels-default",           label: "Channel Icons" },
    { key: "headerPrimary",   cssVar: "--header-primary",             label: "Header Text" },
    { key: "scrollbarThumb",  cssVar: "--scrollbar-auto-thumb",       label: "Scrollbar Thumb" },
];

const settings = definePluginSettings({
    bgPrimary:       { type: OptionType.STRING, description: "Background Primary — main chat area bg", default: "", onChange: apply },
    bgSecondary:     { type: OptionType.STRING, description: "Background Secondary — sidebar bg", default: "", onChange: apply },
    bgTertiary:      { type: OptionType.STRING, description: "Background Tertiary — header/titlebar bg", default: "", onChange: apply },
    bgFloating:      { type: OptionType.STRING, description: "Background Floating — modals and popups", default: "", onChange: apply },
    bgModifierHover: { type: OptionType.STRING, description: "Hover Highlight — background when hovering items", default: "", onChange: apply },
    textNormal:      { type: OptionType.STRING, description: "Text Normal — primary message text color", default: "", onChange: apply },
    textMuted:       { type: OptionType.STRING, description: "Text Muted — timestamps, placeholders, hints", default: "", onChange: apply },
    textLink:        { type: OptionType.STRING, description: "Links — hyperlink text color", default: "", onChange: apply },
    accent:          { type: OptionType.STRING, description: "Accent — main blurple color (buttons, selections)", default: "", onChange: apply },
    accentNew:       { type: OptionType.STRING, description: "Accent Hover — darker shade of accent on hover", default: "", onChange: apply },
    channelIcon:     { type: OptionType.STRING, description: "Channel Icons — default icon color in sidebar", default: "", onChange: apply },
    headerPrimary:   { type: OptionType.STRING, description: "Header Text — channel name and header titles", default: "", onChange: apply },
    scrollbarThumb:  { type: OptionType.STRING, description: "Scrollbar Thumb — scrollbar handle color", default: "", onChange: apply },
});

function isValidColor(value: string): boolean {
    const v = value.trim();
    if (!v) return false;
    // Accept hex (#rgb, #rgba, #rrggbb, #rrggbbaa), rgb(), rgba(), hsl()
    return /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\()/.test(v);
}

function apply() {
    const overrides = VARS
        .map(({ key, cssVar }) => {
            const val = (settings.store as any)[key] as string;
            if (!isValidColor(val)) return null;
            return `    ${cssVar}: ${val.trim()} !important;`;
        })
        .filter(Boolean);

    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

    if (overrides.length === 0) {
        el?.remove();
        return;
    }

    if (!el) {
        el = document.createElement("style") as HTMLStyleElement;
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }

    el.textContent = `:root {\n${overrides.join("\n")}\n}`;
}

export default definePlugin({
    name: "ThemeEditor",
    description: "Live-tweak Discord's CSS color variables from plugin settings. Enter any hex/rgb/hsl value — leave blank to keep Discord's default.",
    authors: [Devs._7n7],
    settings,

    start() {
        apply();
    },

    stop() {
        document.getElementById(STYLE_ID)?.remove();
    },
});
