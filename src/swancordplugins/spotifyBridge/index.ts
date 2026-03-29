/*
 * Swancord — SpotifyBridge
 * Taps into Discord's existing Spotify OAuth token (same strategy as
 * SpotifyControls) and serves now-playing data on localhost for Rainmeter.
 *
 * Endpoint: http://127.0.0.1:8975
 * HTTP server runs in native.ts (main process). This file just forwards
 * SPOTIFY_PLAYER_STATE events to it via IPC.
 */

import definePlugin, { PluginNative } from "@utils/types";
import { Devs } from "@utils/constants";
import { FluxDispatcher } from "@webpack/common";

const Native = Native as PluginNative<typeof import("./native")>;

const PORT = 8975;

interface SpotifyTrack {
    id: string;
    name: string;
    duration: number;
    album: {
        id: string;
        name: string;
        image: { height: number; width: number; url: string; };
    };
    artists: { id: string; name: string; }[];
}

interface PlayerState {
    track: SpotifyTrack | null;
    isPlaying: boolean;
    position: number;
    volumePercent: number;
}

function onPlayerState(e: PlayerState) {
    Native.updateState({
        title:    e.track?.name ?? "",
        artist:   e.track?.artists?.map(a => a.name).join(", ") ?? "",
        album:    e.track?.album?.name ?? "",
        albumArt: e.track?.album?.image?.url ?? "",
        duration: e.track?.duration ?? 0,
        position: e.position ?? 0,
        isPlaying: e.isPlaying ?? false,
        volume:   e.volumePercent ?? 0,
    });
}

export default definePlugin({
    name: "SpotifyBridge",
    description: "Serves Spotify now-playing data on localhost:8975 for Rainmeter",
    authors: [Devs._7n7],

    start() {
        Native.start(PORT);
        FluxDispatcher.subscribe("SPOTIFY_PLAYER_STATE", onPlayerState);
    },

    stop() {
        Native.stop();
        FluxDispatcher.unsubscribe("SPOTIFY_PLAYER_STATE", onPlayerState);
    },
});
