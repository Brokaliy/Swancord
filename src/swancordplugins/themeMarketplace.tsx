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

import * as DataStore from "@api/DataStore";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { ModalCloseButton, ModalContent, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import definePlugin, { OptionType } from "@utils/types";
import { React, Text, Toasts } from "@webpack/common";

const THEMES_URL = "https://7n7.dev/swancord/themes/themes.json";
const DS_KEY = "ThemeMarketplace_installed";

interface ThemeMeta {
    id: string;
    name: string;
    author: string;
    description: string;
    tags: string[];
    preview: string;
    css: string;
}

let styleEl: HTMLStyleElement | null = null;

async function getInstalled(): Promise<Record<string, string>> {
    return (await DataStore.get<Record<string, string>>(DS_KEY)) ?? {};
}

async function rebuildStyles() {
    const installed = await getInstalled();
    const combined = Object.values(installed).join("\n\n");
    if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "swancord-theme-marketplace";
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = combined;
}

async function installTheme(theme: ThemeMeta) {
    const css = await fetch(theme.css).then(r => r.text());
    const installed = await getInstalled();
    installed[theme.id] = css;
    await DataStore.set(DS_KEY, installed);
    await rebuildStyles();
}

async function uninstallTheme(id: string) {
    const installed = await getInstalled();
    delete installed[id];
    await DataStore.set(DS_KEY, installed);
    await rebuildStyles();
}

function ThemeCard({ theme, installed, onToggle }: {
    theme: ThemeMeta;
    installed: boolean;
    onToggle: () => Promise<void>;
}) {
    const [busy, setBusy] = React.useState(false);

    async function handleClick() {
        setBusy(true);
        try { await onToggle(); } finally { setBusy(false); }
    }

    return (
        <div style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 14px",
            marginBottom: 8,
            background: "var(--background-secondary)",
            border: "1px solid var(--background-modifier-accent)",
            borderRadius: 10,
        }}>
            <div style={{
                width: 44,
                height: 44,
                borderRadius: 8,
                background: theme.preview,
                flexShrink: 0,
                boxShadow: `0 0 12px ${theme.preview}66`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{theme.name}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 2 }}>by {theme.author}</div>
                <div style={{ fontSize: "0.8rem", opacity: 0.85 }}>{theme.description}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" as const }}>
                    {theme.tags.map(tag => (
                        <span key={tag} style={{
                            fontSize: "0.65rem",
                            padding: "1px 7px",
                            borderRadius: 999,
                            background: "var(--background-modifier-accent)",
                            color: "var(--text-muted)",
                        }}>{tag}</span>
                    ))}
                </div>
            </div>
            <button
                disabled={busy}
                onClick={handleClick}
                style={{
                    padding: "7px 16px",
                    borderRadius: 6,
                    border: installed ? "1px solid var(--status-danger)" : "none",
                    background: installed ? "transparent" : "var(--brand-500, #5865f2)",
                    color: installed ? "var(--status-danger)" : "#fff",
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: busy ? "wait" : "pointer",
                    flexShrink: 0,
                    opacity: busy ? 0.6 : 1,
                    transition: "opacity 0.15s",
                }}
            >
                {busy ? "…" : installed ? "Remove" : "Install"}
            </button>
        </div>
    );
}

function ThemeMarketplaceModal({ modalProps }: { modalProps: any; }) {
    const [themes, setThemes] = React.useState<ThemeMeta[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(false);
    const [installedIds, setInstalledIds] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        let alive = true;
        Promise.all([
            fetch(THEMES_URL).then(r => r.json()),
            getInstalled(),
        ]).then(([data, installed]: [ThemeMeta[], Record<string, string>]) => {
            if (!alive) return;
            setThemes(data);
            setInstalledIds(new Set(Object.keys(installed)));
            setLoading(false);
        }).catch(() => {
            if (alive) { setError(true); setLoading(false); }
        });
        return () => { alive = false; };
    }, []);

    async function handleToggle(theme: ThemeMeta) {
        if (installedIds.has(theme.id)) {
            await uninstallTheme(theme.id);
            setInstalledIds(prev => { const s = new Set(prev); s.delete(theme.id); return s; });
            Toasts.show({ message: `Removed "${theme.name}"`, type: Toasts.Type.MESSAGE, id: Toasts.genId() });
        } else {
            await installTheme(theme);
            setInstalledIds(prev => new Set([...prev, theme.id]));
            Toasts.show({ message: `Installed "${theme.name}"`, type: Toasts.Type.SUCCESS, id: Toasts.genId() });
        }
    }

    return (
        <ModalRoot {...modalProps} size="medium">
            <ModalHeader separator={false} style={{ padding: "16px 16px 0" }}>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Theme Marketplace</Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent style={{ padding: "16px" }}>
                {loading && (
                    <Text variant="text-md/normal" style={{ textAlign: "center" as const, padding: "32px 0", color: "var(--text-muted)" }}>
                        Loading themes…
                    </Text>
                )}
                {error && (
                    <Text variant="text-md/normal" style={{ textAlign: "center" as const, padding: "32px 0", color: "var(--text-danger)" }}>
                        Failed to load themes. Check your connection.
                    </Text>
                )}
                {themes.map(theme => (
                    <ThemeCard
                        key={theme.id}
                        theme={theme}
                        installed={installedIds.has(theme.id)}
                        onToggle={() => handleToggle(theme)}
                    />
                ))}
            </ModalContent>
        </ModalRoot>
    );
}

const settings = definePluginSettings({
    _browse: {
        type: OptionType.COMPONENT,
        description: "Browse and install CSS themes from the Swancord marketplace",
        component: () => (
            <button
                onClick={() => openModal(props => <ThemeMarketplaceModal modalProps={props} />)}
                style={{
                    padding: "8px 20px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--brand-500, #5865f2)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                }}
            >
                Browse Themes
            </button>
        ),
    },
});

export default definePlugin({
    name: "ThemeMarketplace",
    description: "Browse and one-click install CSS themes from 7n7.dev/swancord/themes. Installed themes persist across restarts.",
    authors: [Devs._7n7],
    settings,

    async start() {
        await rebuildStyles();
    },

    stop() {
        if (styleEl) {
            styleEl.remove();
            styleEl = null;
        }
    },
});
