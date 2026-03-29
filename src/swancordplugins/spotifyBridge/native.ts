/*
 * SpotifyBridge — native.ts
 * Runs in the Electron main/preload process (has full Node.js access).
 */

import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import type { IpcMainInvokeEvent } from "electron";

const COVER_PATH = path.join(os.tmpdir(), "swancord_cover.jpg");

let server: http.Server | null = null;
let snapshotAt = 0;
let lastAlbumArt = "";

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

function downloadCover(url: string): void {
    if (!url || url === lastAlbumArt) return;
    lastAlbumArt = url;

    const file = fs.createWriteStream(COVER_PATH);
    https.get(url, res => {
        res.pipe(file);
        file.on("finish", () => file.close());
    }).on("error", () => {
        fs.unlink(COVER_PATH, () => {});
    });
}

const fmt = (ms: number) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export async function start(_event: IpcMainInvokeEvent, port: number): Promise<void> {
    if (server) return;

    server = http.createServer((_req, res) => {
        const elapsed = state.isPlaying ? Date.now() - snapshotAt : 0;
        const livePos = Math.min(state.position + elapsed, state.duration);
        const progress = state.duration > 0 ? livePos / state.duration : 0;

        const payload = JSON.stringify({
            title:      state.title,
            artist:     state.artist,
            album:      state.album,
            posStr:     fmt(livePos),
            durStr:     fmt(state.duration),
            progress:   progress,
            isPlaying:  state.isPlaying,
            coverPath:  COVER_PATH,
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
    downloadCover(newState.albumArt);
    state = newState;
    snapshotAt = Date.now();
}
