/*
 * Swancord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Command } from "@swancord/discord-types";
export { ApplicationCommandInputType, ApplicationCommandOptionType, ApplicationCommandType } from "@swancord/discord-types/enums";

export interface SwancordCommand extends Command {
    isSwancordCommand?: boolean;
}
