/*
 * Swancord, a Discord client mod
 * Copyright (c) 2025 Swancord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings, useSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { Forms } from "@webpack/common";
import { React } from "@webpack/common";

// Pre-installed themes are stored in the user's Vencord themes directory.
// The installer drops these .css files alongside Swancord so they appear
// in the Local Themes tab automatically. This tab explains how to get them
// and shows a curated list of themes that ship with the installer.

const PREINSTALLED_THEMES: Array<{
    name: string;
    author: string;
    description: string;
    source: string;
    tags: string[];
}> = [
    {
        name: "Midnight",
        author: "Discord / refact0r",
        description: "Clean dark theme based on Discord Midnight — true black backgrounds with subtle accents.",
        source: "https://github.com/refact0r/midnight-discord",
        tags: ["Dark", "Minimal"],
    },
    {
        name: "Catppuccin Mocha",
        author: "catppuccin",
        description: "Warm dark theme from the Catppuccin palette — mauve, peach, and lavender accents.",
        source: "https://github.com/catppuccin/discord",
        tags: ["Dark", "Pastel"],
    },
    {
        name: "Tokyo Night",
        author: "guilded",
        description: "Dark blue theme inspired by the Tokyo Night VSCode color scheme.",
        source: "https://github.com/guilded/TokyoNight",
        tags: ["Dark", "Blue"],
    },
    {
        name: "Dracula",
        author: "dracula",
        description: "The classic Dracula color scheme adapted for Discord — purple and pink on dark.",
        source: "https://github.com/dracula/discord",
        tags: ["Dark", "Purple"],
    },
    {
        name: "Nord",
        author: "hamishb",
        description: "Arctic, north-bluish color palette — muted blues and greys for a calming experience.",
        source: "https://github.com/hamishb/Nord-Theme-for-Discord",
        tags: ["Dark", "Blue", "Minimal"],
    },
    {
        name: "Gruvbox Material",
        author: "CapnKitten",
        description: "Warm retro groove palette — earthy oranges, yellows, and greens on a dark background.",
        source: "https://github.com/CapnKitten/Gruvbox",
        tags: ["Dark", "Warm"],
    },
];

const tagColors: Record<string, string> = {
    Dark:    "rgba(255,255,255,0.07)",
    Minimal: "rgba(255,255,255,0.07)",
    Blue:    "rgba(88,101,242,0.14)",
    Purple:  "rgba(124,58,237,0.14)",
    Pastel:  "rgba(244,114,182,0.12)",
    Warm:    "rgba(234,88,12,0.12)",
};

function ThemeEntry({ theme }: { theme: typeof PREINSTALLED_THEMES[0]; }) {
    return (
        <div style={{
            background: "var(--background-secondary, #111)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--header-primary, #f0f0f0)" }}>
                    {theme.name}
                </span>
                <a
                    href={theme.source}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        fontSize: "0.72rem",
                        color: "var(--text-link, #a78bfa)",
                        textDecoration: "none",
                        padding: "2px 8px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        whiteSpace: "nowrap",
                    }}
                >
                    Source ↗
                </a>
            </div>

            <span style={{ fontSize: "0.75rem", color: "var(--text-muted, rgba(240,240,240,0.4))" }}>
                by {theme.author}
            </span>

            <p style={{ margin: 0, fontSize: "0.83rem", color: "var(--text-normal, #e0e0e0)", lineHeight: 1.5 }}>
                {theme.description}
            </p>

            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" as const, marginTop: "2px" }}>
                {theme.tags.map(tag => (
                    <span key={tag} style={{
                        fontSize: "0.68rem",
                        padding: "2px 7px",
                        borderRadius: "4px",
                        background: tagColors[tag] ?? "rgba(255,255,255,0.06)",
                        color: "var(--text-muted, rgba(240,240,240,0.55))",
                        border: "1px solid rgba(255,255,255,0.06)",
                        fontFamily: "var(--font-code, monospace)",
                        letterSpacing: "0.04em",
                    }}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function PreInstalledThemesTab() {
    return (
        <Flex flexDirection="column" style={{ gap: "16px" }}>
            <div style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.22)",
                borderRadius: "8px",
                padding: "12px 16px",
            }}>
                <Forms.FormTitle tag="h5" style={{ margin: 0, marginBottom: "4px", color: "#c4b5fd" }}>
                    Pre-Installed with the Installer
                </Forms.FormTitle>
                <Forms.FormText style={{ margin: 0 }}>
                    The Swancord installer automatically drops these themes into your themes folder — they'll
                    appear in the <strong>Local Themes</strong> tab ready to enable. Sources are linked below
                    if you want to update or find more themes from the same authors.
                </Forms.FormText>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
                {PREINSTALLED_THEMES.map(theme => (
                    <ThemeEntry key={theme.name} theme={theme} />
                ))}
            </div>

            <Forms.FormDivider />

            <Forms.FormText style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                Want to add your own BetterDiscord-compatible themes?{" "}
                Download <code>.css</code> theme files and place them in your Vencord themes folder —
                accessible via <strong>Local Themes → Open Themes Folder</strong>.
            </Forms.FormText>
        </Flex>
    );
}
