/*
 * Swancord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

export const enum IpcEvents {
    INIT_FILE_WATCHERS = "SwancordInitFileWatchers",

    OPEN_QUICKCSS = "SwancordOpenQuickCss",
    GET_QUICK_CSS = "SwancordGetQuickCss",
    SET_QUICK_CSS = "SwancordSetQuickCss",
    QUICK_CSS_UPDATE = "SwancordQuickCssUpdate",

    GET_SETTINGS = "SwancordGetSettings",
    SET_SETTINGS = "SwancordSetSettings",

    GET_THEMES_LIST = "SwancordGetThemesList",
    GET_THEME_DATA = "SwancordGetThemeData",
    GET_THEME_SYSTEM_VALUES = "SwancordGetThemeSystemValues",
    THEME_UPDATE = "SwancordThemeUpdate",

    OPEN_EXTERNAL = "SwancordOpenExternal",
    OPEN_THEMES_FOLDER = "SwancordOpenThemesFolder",
    OPEN_SETTINGS_FOLDER = "SwancordOpenSettingsFolder",

    GET_UPDATES = "SwancordGetUpdates",
    GET_REPO = "SwancordGetRepo",
    UPDATE = "SwancordUpdate",
    BUILD = "SwancordBuild",

    OPEN_MONACO_EDITOR = "SwancordOpenMonacoEditor",
    GET_MONACO_THEME = "SwancordGetMonacoTheme",

    GET_PLUGIN_IPC_METHOD_MAP = "SwancordGetPluginIpcMethodMap",

    CSP_IS_DOMAIN_ALLOWED = "SwancordCspIsDomainAllowed",
    CSP_REMOVE_OVERRIDE = "SwancordCspRemoveOverride",
    CSP_REQUEST_ADD_OVERRIDE = "SwancordCspRequestAddOverride",

    GET_RENDERER_CSS = "SwancordGetRendererCss",
    RENDERER_CSS_UPDATE = "SwancordRendererCssUpdate",
    PRELOAD_GET_RENDERER_JS = "SwancordPreloadGetRendererJs",

    DISBOARD_FETCH = "SwancordDisboardFetch",
}
