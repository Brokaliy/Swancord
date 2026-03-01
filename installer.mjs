#!/usr/bin/env node
// Swancord Installer

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { join } from "path";
import os from "os";

const RELEASE_BASE = "https://github.com/Brokaliy/Swancord/releases/download/devbuild";
const FILES = ["patcher.js", "preload.js", "renderer.js", "renderer.css"];

// ─── ANSI ──────────────────────────────────────────────────────────────────
const R = "\x1b[0m";
const Bold = s => `\x1b[1m${s}${R}`;
const c = {
    white:  s => `\x1b[97m${s}${R}`,
    gray:   s => `\x1b[90m${s}${R}`,
    red:    s => `\x1b[91m${s}${R}`,
    green:  s => `\x1b[92m${s}${R}`,
    yellow: s => `\x1b[93m${s}${R}`,
    cyan:   s => `\x1b[96m${s}${R}`,
};

function print(s = "")    { process.stdout.write(s + "\n"); }
function printRaw(s = "") { process.stdout.write(s); }

// ─── HEADER ────────────────────────────────────────────────────────────────
function printHeader() {
    print();
    print(c.white("  ███████╗██╗    ██╗ █████╗ ███╗   ██╗ ██████╗ ██████╗ ██████╗ ██████╗ "));
    print(c.white("  ██╔════╝██║    ██║██╔══██╗████╗  ██║██╔════╝██╔═══██╗██╔══██╗██╔══██╗"));
    print(c.white("  ███████╗██║ █╗ ██║███████║██╔██╗ ██║██║     ██║   ██║██████╔╝██║  ██║"));
    print(c.white("  ╚════██║██║███╗██║██╔══██║██║╚██╗██║██║     ██║   ██║██╔══██╗██║  ██║"));
    print(c.white("  ███████║╚███╔███╔╝██║  ██║██║ ╚████║╚██████╗╚██████╔╝██║  ██║██████╔╝"));
    print(c.white("  ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ "));
    print();
    print(c.gray("  A Discord mod by 7n7 · based on Vencord"));
    print(c.gray("  ─────────────────────────────────────────────────────────────────────"));
    print();
}

// ─── SPINNER ───────────────────────────────────────────────────────────────
const SPIN = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
let spinIdx = 0;
let spinTimer = null;

function startSpinner(msg) {
    spinIdx = 0;
    printRaw(`  ${c.cyan(SPIN[0])} ${msg}`);
    spinTimer = setInterval(() => {
        spinIdx = (spinIdx + 1) % SPIN.length;
        process.stdout.write(`\r  ${c.cyan(SPIN[spinIdx])} ${msg}`);
    }, 80);
}

function stopSpinner(ok, msg) {
    if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
    const icon = ok ? c.green("✓") : c.red("✗");
    process.stdout.write(`\r  ${icon} ${msg}\n`);
}

// ─── INPUT ─────────────────────────────────────────────────────────────────
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(res => rl.question(q, res));

async function pickFromList(items, prompt) {
    items.forEach((item, i) => {
        print(`  ${c.cyan(`[${i + 1}]`)} ${item.label}`);
        if (item.sub) print(`      ${c.gray(item.sub)}`);
    });
    print(`  ${c.cyan("[0]")} Cancel`);
    print();
    const ans = await ask(`  ${c.white("→")} ${prompt} `);
    const n = parseInt(ans, 10);
    if (n === 0 || isNaN(n)) return null;
    return items[n - 1] ?? null;
}

// ─── PATHS ─────────────────────────────────────────────────────────────────
function getSwancordDir() {
    const p = process.platform;
    if (p === "win32")  return join(process.env.APPDATA ?? join(os.homedir(), "AppData", "Roaming"), "Swancord");
    if (p === "darwin") return join(os.homedir(), "Library", "Application Support", "Swancord");
    return join(os.homedir(), ".config", "Swancord");
}

// ─── DOWNLOAD ──────────────────────────────────────────────────────────────
async function downloadFile(url, dest) {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const buf = await res.arrayBuffer();
    writeFileSync(dest, Buffer.from(buf));
}

async function downloadLatest() {
    const dir = getSwancordDir();
    mkdirSync(dir, { recursive: true });
    for (const file of FILES) {
        await downloadFile(`${RELEASE_BASE}/${file}`, join(dir, file));
    }
    return dir;
}

// ─── DISCORD DETECTION ─────────────────────────────────────────────────────
function getDiscordInstalls() {
    const installs = [];
    const platform = process.platform;
    const candidates = [];

    if (platform === "win32") {
        const localAppData = process.env.LOCALAPPDATA ?? join(os.homedir(), "AppData", "Local");
        candidates.push(
            { name: "Discord Stable",  dir: join(localAppData, "Discord") },
            { name: "Discord PTB",     dir: join(localAppData, "DiscordPTB") },
            { name: "Discord Canary",  dir: join(localAppData, "DiscordCanary") },
            { name: "Discord Dev",     dir: join(localAppData, "DiscordDevelopment") },
        );
    } else if (platform === "darwin") {
        candidates.push(
            { name: "Discord Stable",  dir: join(os.homedir(), "Library", "Application Support", "discord") },
            { name: "Discord PTB",     dir: join(os.homedir(), "Library", "Application Support", "discordptb") },
            { name: "Discord Canary",  dir: join(os.homedir(), "Library", "Application Support", "discordcanary") },
        );
    } else {
        candidates.push(
            { name: "Discord Stable",  dir: join(os.homedir(), ".config", "discord") },
            { name: "Discord PTB",     dir: join(os.homedir(), ".config", "discordptb") },
            { name: "Discord Canary",  dir: join(os.homedir(), ".config", "discordcanary") },
        );
    }

    for (const candidate of candidates) {
        if (!existsSync(candidate.dir)) continue;
        try {
            const entries = readdirSync(candidate.dir).filter(e => e.startsWith("app-"));
            if (!entries.length) continue;
            entries.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            const appDir = join(candidate.dir, entries[0], "modules");
            if (!existsSync(appDir)) continue;
            const coreDir = readdirSync(appDir).find(e => e.startsWith("discord_desktop_core"));
            if (!coreDir) continue;
            const coreModDir = join(appDir, coreDir, "discord_desktop_core");
            if (!existsSync(coreModDir)) continue;
            installs.push({ name: candidate.name, coreDir: coreModDir, label: candidate.name, sub: coreModDir });
        } catch { continue; }
    }

    return installs;
}

// ─── PATCH / UNPATCH ───────────────────────────────────────────────────────
function isInstalled(discordInstall) {
    const indexFile = join(discordInstall.coreDir, "index.js");
    if (!existsSync(indexFile)) return false;
    return readFileSync(indexFile, "utf-8").includes("// Swancord");
}

function patchDiscord(discordInstall, swancordDir) {
    const indexFile = join(discordInstall.coreDir, "index.js");
    if (!existsSync(indexFile)) throw new Error("index.js not found in discord_desktop_core");

    const patcherPath = join(swancordDir, "patcher.js").replace(/\\/g, "/");
    const patchLine = `require("${patcherPath}");`;
    const content = readFileSync(indexFile, "utf-8");

    let newContent;
    if (content.includes(patchLine)) {
        newContent = content; // already up to date
    } else if (content.includes("// Swancord")) {
        newContent = content.replace(/require\(".*patcher\.js"\);/, patchLine);
    } else {
        newContent = `// Swancord\n${patchLine}\n\n${content}`;
    }

    writeFileSync(indexFile, newContent, "utf-8");
}

function unpatchDiscord(discordInstall) {
    const indexFile = join(discordInstall.coreDir, "index.js");
    if (!existsSync(indexFile)) throw new Error("index.js not found");
    let content = readFileSync(indexFile, "utf-8");
    content = content
        .replace(/\/\/ Swancord\n/, "")
        .replace(/require\(".*patcher\.js"\);\n\n?/, "");
    writeFileSync(indexFile, content, "utf-8");
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
    printHeader();

    print(c.white("  What would you like to do?"));
    print();
    const action = await pickFromList([
        { label: "Install Swancord",   sub: "Download the latest build and patch Discord" },
        { label: "Uninstall Swancord", sub: "Remove the Swancord patch from Discord" },
        { label: "Reinstall / Update", sub: "Re-download the latest build and re-apply the patch" },
    ], "Choose an action:");

    if (!action) {
        print();
        print(`  ${c.gray("Cancelled.")}`);
        rl.close();
        return;
    }

    print();
    print(c.white("  Detecting Discord installations..."));
    print();

    const installs = getDiscordInstalls();

    if (!installs.length) {
        print(`  ${c.red("✗")} No Discord installations found.`);
        print(`  ${c.gray("Make sure Discord is installed and has been opened at least once.")}`);
        print();
        rl.close();
        return;
    }

    installs.forEach(i => {
        if (isInstalled(i)) i.label = `${i.name}${c.green("  [Swancord installed]")}`;
    });

    print(c.white("  Select a Discord installation:"));
    print();
    const chosen = await pickFromList(installs, "Choose installation:");

    if (!chosen) {
        print();
        print(`  ${c.gray("Cancelled.")}`);
        rl.close();
        return;
    }

    print();

    if (action.label.startsWith("Uninstall")) {
        startSpinner("Removing Swancord patch…");
        try {
            unpatchDiscord(chosen);
            stopSpinner(true, "Swancord patch removed successfully.");
        } catch (err) {
            stopSpinner(false, `Failed: ${err.message}`);
        }
    } else {
        startSpinner("Downloading latest Swancord build…");
        let swancordDir;
        try {
            swancordDir = await downloadLatest();
            stopSpinner(true, `Downloaded to ${swancordDir}`);
        } catch (err) {
            stopSpinner(false, `Download failed: ${err.message}`);
            print();
            print(`  ${c.yellow("!")} Make sure you have an internet connection and try again.`);
            rl.close();
            return;
        }

        startSpinner("Patching Discord…");
        try {
            patchDiscord(chosen, swancordDir);
            stopSpinner(true, `${chosen.name} patched successfully.`);
        } catch (err) {
            stopSpinner(false, `Failed: ${err.message}`);
            rl.close();
            return;
        }
    }

    print();
    print(c.gray("  ─────────────────────────────────────────────────────────────────────"));
    print();

    if (action.label.startsWith("Uninstall")) {
        print(`  ${c.green("✓")}  ${Bold("Swancord removed.")} Restart Discord to apply.`);
    } else {
        print(`  ${c.green("✓")}  ${Bold("Swancord installed!")} Restart Discord to apply.`);
        print();
        print(`  ${c.gray("Tip:")} Open Discord Settings → Swancord to configure plugins and themes.`);
        print(`  ${c.gray("Tip:")} Run this installer again and choose Reinstall / Update to get the latest.`);
    }

    print();
    rl.close();
}

main().catch(err => {
    print();
    print(`  ${c.red("Fatal error:")} ${err.message}`);
    print();
    process.exit(1);
});
