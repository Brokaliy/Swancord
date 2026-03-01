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

import { ApplicationCommandInputType } from "@api/Commands";
import * as DataStore from "@api/DataStore";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalProps, ModalRoot, openModal } from "@utils/modal";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Button, Forms, React, TextArea, useEffect, useState } from "@webpack/common";

const DS_KEY = "QuickNote_content";

function NoteModal({ props }: { props: ModalProps; }) {
    const [text, setText] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        DataStore.get<string>(DS_KEY).then(v => {
            if (v) setText(v);
        });
    }, []);

    async function save() {
        await DataStore.set(DS_KEY, text);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    }

    async function clear() {
        await DataStore.del(DS_KEY);
        setText("");
    }

    return (
        <ModalRoot {...props} size="large">
            <ModalHeader>
                <Forms.FormTitle tag="h4" style={{ margin: 0, flex: 1 }}>Quick Note</Forms.FormTitle>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>

            <ModalContent style={{ padding: "16px" }}>
                <TextArea
                    value={text}
                    onChange={setText}
                    placeholder="Write something..."
                    rows={16}
                    style={{
                        resize: "none",
                        fontFamily: "var(--font-code)",
                        fontSize: "0.85rem",
                        lineHeight: 1.6,
                        width: "100%",
                        boxSizing: "border-box",
                    }}
                />
            </ModalContent>

            <ModalFooter>
                <Button
                    color={Button.Colors.BRAND}
                    onClick={save}
                    style={{ marginRight: 8 }}
                >
                    {saved ? "Saved!" : "Save"}
                </Button>
                <Button
                    color={Button.Colors.RED}
                    look={Button.Looks.OUTLINED}
                    onClick={clear}
                >
                    Clear
                </Button>
            </ModalFooter>
        </ModalRoot>
    );
}

export default definePlugin({
    name: "QuickNote",
    description: "Type /note to open a persistent scratchpad. Notes survive restarts.",
    authors: [Devs._7n7],

    commands: [
        {
            name: "note",
            description: "Open your persistent quick note scratchpad",
            inputType: ApplicationCommandInputType.BUILT_IN,
            execute: async () => {
                openModal(props => <NoteModal props={props} />);
            },
        },
    ],
});
