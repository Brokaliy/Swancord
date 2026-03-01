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

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { findByPropsLazy } from "@webpack";

const AuthActions = findByPropsLazy("logout", "login");

let originalLogout: ((...args: any[]) => any) | null = null;

export default definePlugin({
    name: "ConfirmLogout",
    description: "Shows a confirmation dialog before logging out of Discord.",
    authors: [Devs._7n7],

    start() {
        if (AuthActions && typeof AuthActions.logout === "function") {
            originalLogout = AuthActions.logout;
            AuthActions.logout = function (...args: any[]) {
                if (window.confirm("Are you sure you want to log out of Discord?")) {
                    originalLogout?.apply(this, args);
                }
            };
        }
    },

    stop() {
        if (AuthActions && originalLogout) {
            AuthActions.logout = originalLogout;
            originalLogout = null;
        }
    },
});
