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
import { showNotification } from "@api/Notifications";
import { Devs } from "@utils/constants";
import { ModalCloseButton, ModalContent, ModalHeader, ModalRoot, openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { Text } from "@webpack/common";

const CHANGELOG_URL = "https://7n7.dev/swancord/changelog.json";
const DATASTORE_KEY = "SwancordChangelog_lastSeen";

interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    changes: string[];
}

function ChangelogModal({ modalProps, entries }: { modalProps: any; entries: ChangelogEntry[]; }) {
    return (
        <ModalRoot {...modalProps} size="medium">
            <ModalHeader separator={false} style={{ padding: "16px 16px 0" }}>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>
                    What's New in Swancord
                </Text>
                <ModalCloseButton onClick={modalProps.onClose} />
            </ModalHeader>
            <ModalContent style={{ padding: "16px", overflowY: "auto" }}>
                {entries.map((entry, i) => (
                    <div key={entry.version}>
                        {i > 0 && (
                            <div style={{
                                borderTop: "1px solid var(--background-modifier-accent)",
                                margin: "16px 0"
                            }} />
                        )}
                        <Text variant="heading-md/semibold">{entry.title}</Text>
                        <Text
                            variant="text-xs/normal"
                            style={{ color: "var(--text-muted)", marginBottom: "8px", marginTop: "2px" }}
                        >
                            {entry.date} · {entry.version}
                        </Text>
                        <ul style={{ paddingLeft: "20px", margin: 0 }}>
                            {entry.changes.map((change, j) => (
                                <li key={j} style={{ marginBottom: "4px" }}>
                                    <Text variant="text-sm/normal">{change}</Text>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </ModalContent>
        </ModalRoot>
    );
}

export default definePlugin({
    name: "SwancordChangelog",
    description: "Shows a changelog popup when Swancord updates.",
    authors: [Devs._7n7],
    required: true,

    async start() {
        try {
            const res = await fetch(CHANGELOG_URL);
            if (!res.ok) return;

            const entries: ChangelogEntry[] = await res.json();
            if (!entries.length) return;

            const latest = entries[0].version;
            const lastSeen = await DataStore.get(DATASTORE_KEY);
            if (lastSeen === latest) return;

            // First install — silently record version, don't show changelog
            if (!lastSeen) {
                await DataStore.set(DATASTORE_KEY, latest);
                return;
            }

            await DataStore.set(DATASTORE_KEY, latest);

            const openChangelogModal = () => openModal(props => (
                <ChangelogModal modalProps={props} entries={entries.slice(0, 3)} />
            ));

            let modalOpened = false;

            // Notification fires first so users see it even if they dismiss the modal
            setTimeout(() => {
                showNotification({
                    title: "Swancord Updated!",
                    body: entries[0].title,
                    icon: "https://7n7.dev/badges/CreatorBadge.png",
                    onClick: () => {
                        modalOpened = true;
                        clearTimeout(modalTimeout);
                        openChangelogModal();
                    },
                    noPersist: true,
                });
            }, 2000);

            // Modal auto-opens unless the notification was already clicked
            const modalTimeout = setTimeout(() => {
                if (!modalOpened) openChangelogModal();
            }, 3000);
        } catch {
            // silently fail — changelog is optional
        }
    },
});
