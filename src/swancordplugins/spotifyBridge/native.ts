/*
 * SpotifyBridge — native.ts
 * Runs in the Electron main/preload process (has full Node.js access).
 * Called from the renderer via VencordNative.pluginHelpers.SpotifyBridge.*
 */

import * as http from "http";
import type { IpcMainInvokeEvent } from "electron";

let server: http.Server | null = null;
let snapshotAt = 0;

let state = {
    title: "",
    artist: "",
    album: "",
    albumArt: "",
    duration: 0,
    position: 0,
    isPlaying: false,
    volume: 0,
};

export async function start(_event: IpcMainInvokeEvent, port: number): Promise<void> {
    if (server) return;

    server = http.createServer((_req, res) => {
        const elapsed = state.isPlaying ? Date.now() - snapshotAt : 0;
        const livePos = Math.min(state.position + elapsed, state.duration);

        // Field order is intentional — Rainmeter regex relies on it
        const payload = JSON.stringify({
            title:     state.title,
            artist:    state.artist,
            album:     state.album,
            albumArt:  state.albumArt,
            duration:  state.duration,
            position:  livePos,
            isPlaying: state.isPlaying,
            volume:    state.volume,
        });

        res.writeHead(200, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        });
        res.end(payload);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
        console.error("[SpotifyBridge] Server error:", err.message);
    });

    server.listen(port, "127.0.0.1", () => {
        console.log(`[SpotifyBridge] Serving on http://127.0.0.1:${port}`);
    });
}

export async function stop(_event: IpcMainInvokeEvent): Promise<void> {
    server?.close();
    server = null;
}

export async function updateState(_event: IpcMainInvokeEvent, newState: typeof state): Promise<void> {
    state = newState;
    snapshotAt = Date.now();
}
