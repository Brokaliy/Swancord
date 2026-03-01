/*
 * Swancord, a Discord client mod
 * Copyright (c) 2025 Swancord contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings, useSettings } from "@api/Settings";
import { AddonCard } from "@components/settings/AddonCard";
import { Flex } from "@components/Flex";
import { Forms } from "@webpack/common";
import { React } from "@webpack/common";
import SwancordThemes from "~swancord-themes";

export function SwancordThemesTab() {
    const settings = useSettings(["enabledSwancordThemes"]);

    if (SwancordThemes.length === 0) {
        return (
            <Flex flexDirection="column" gap="1em">
                <Forms.FormText>
                    No bundled themes yet. Add <code>.css</code> files to <code>src/swancordthemes/</code> and rebuild.
                </Forms.FormText>
                <Forms.FormText style={{ color: "var(--text-muted)" }}>
                    Each CSS file can include metadata at the top:<br />
                    <code>/* @name My Theme */</code><br />
                    <code>/* @description A cool theme */</code><br />
                    <code>/* @author YourName */</code>
                </Forms.FormText>
            </Flex>
        );
    }

    return (
        <div className="vc-settings-theme-grid">
            {SwancordThemes.map(theme => (
                <AddonCard
                    key={theme.id}
                    name={theme.name}
                    description={theme.description || "No description provided."}
                    author={theme.author || "Unknown"}
                    enabled={settings.enabledSwancordThemes.includes(theme.id)}
                    setEnabled={enabled => {
                        if (enabled) {
                            if (!Settings.enabledSwancordThemes.includes(theme.id))
                                Settings.enabledSwancordThemes = [...Settings.enabledSwancordThemes, theme.id];
                        } else {
                            Settings.enabledSwancordThemes = Settings.enabledSwancordThemes.filter(id => id !== theme.id);
                        }
                    }}
                />
            ))}
        </div>
    );
}
