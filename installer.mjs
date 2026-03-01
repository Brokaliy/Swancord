#!/usr/bin/env node
// Swancord Installer
// Modeled after the Vencord CLI installer experience.

import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { copyFile, cp, mkdir, readdir, readFile, writeFile } from "fs/promises";
import { createInterface } from "readline";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync, spawnSync } from "child_process";
import os from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── ANSI ──────────────────────────────────────────────────────────────────
const R = "\x1b[0m";
const Bold = s => `\x1b[1m${s}${R}`;
const Dim  = s => `\x1b[2m${s}${R}`;
const c = {
    white:  s => `\x1b[97m${s}${R}`,
    gray:   s => `\x1b[90m${s}${R}`,
    red:    s => `\x1b[91m${s}${R}`,
    green:  s => `\x1b[92m${s}${R}`,
    yellow: s => `\x1b[93m${s}${R}`,
    blue:   s => `\x1b[94m${s}${R}`,
    cyan:   s => `\x1b[96m${s}${R}`,
};

function print(s = "")   { process.stdout.write(s + "\n"); }
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
        // Linux
        candidates.push(
            { name: "Discord Stable",  dir: join(os.homedir(), ".config", "discord") },
            { name: "Discord PTB",     dir: join(os.homedir(), ".config", "discordptb") },
            { name: "Discord Canary",  dir: join(os.homedir(), ".config", "discordcanary") },
        );
    }

    for (const c of candidates) {
        if (!existsSync(c.dir)) continue;

        // Find the versioned app dir (e.g. app-1.0.9020)
        let appDir = null;
        try {
            const entries = readdirSync(c.dir).filter(e => e.startsWith("app-"));
            if (entries.length === 0) continue;
            entries.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
            appDir = join(c.dir, entries[0], "modules");

            // Find discord_desktop_core
            if (!existsSync(appDir)) continue;
            const coreDir = readdirSync(appDir).find(e => e.startsWith("discord_desktop_core"));
            if (!coreDir) continue;
            const coreModDir = join(appDir, coreDir, "discord_desktop_core");
            if (!existsSync(coreModDir)) continue;

            installs.push({
                name: c.name,
                dir: c.dir,
                coreDir: coreModDir,
                label: c.name,
                sub: coreModDir,
            });
        } catch { continue; }
    }

    return installs;
}

// ─── COPY DIST ─────────────────────────────────────────────────────────────
async function copyRecursive(src, dest) {
    await mkdir(dest, { recursive: true });
    const entries = await readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const s = join(src, entry.name);
        const d = join(dest, entry.name);
        if (entry.isDirectory()) await copyRecursive(s, d);
        else await copyFile(s, d);
    }
}

async function install(discordInstall) {
    const distDir = join(__dirname, "dist");
    if (!existsSync(distDir)) {
        throw new Error("dist/ folder not found — run 'node scripts/build/build.mjs' first");
    }

    // Patch index.js in discord_desktop_core to require patcher.js
    const indexFile = join(discordInstall.coreDir, "index.js");
    if (!existsSync(indexFile)) throw new Error("index.js not found in discord_desktop_core");

    const indexContent = readFileSync(indexFile, "utf-8");
    const patcherPath = join(distDir, "patcher.js").replace(/\\/g, "/");
    const patchLine = `require("${patcherPath}");`;

    let newContent;
    if (indexContent.includes(patchLine)) {
        newContent = indexContent; // already patched
    } else if (indexContent.includes("// Swancord")) {
        // Update existing swancord patch line
        newContent = indexContent.replace(/require\(".*patcher\.js"\);/, patchLine);
    } else {
        newContent = `// Swancord\n${patchLine}\n\n${indexContent}`;
    }

    writeFileSync(indexFile, newContent, "utf-8");
}

async function uninstall(discordInstall) {
    const indexFile = join(discordInstall.coreDir, "index.js");
    if (!existsSync(indexFile)) throw new Error("index.js not found");

    let content = readFileSync(indexFile, "utf-8");
    content = content
        .replace(/\/\/ Swancord\n/, "")
        .replace(/require\(".*patcher\.js"\);\n\n?/, "");
    writeFileSync(indexFile, content, "utf-8");
}

// ─── CHECK EXISTING ────────────────────────────────────────────────────────
function isInstalled(discordInstall) {
    const indexFile = join(discordInstall.coreDir, "index.js");
    if (!existsSync(indexFile)) return false;
    const content = readFileSync(indexFile, "utf-8");
    return content.includes("// Swancord") || content.includes("patcher.js");
}

// ─── MAIN ──────────────────────────────────────────────────────────────────
async function main() {
    printHeader();

    print(c.white("  What would you like to do?"));
    print();
    const action = await pickFromList([
        { label: "Install Swancord",   sub: "Patch a Discord installation" },
        { label: "Uninstall Swancord", sub: "Remove the Swancord patch" },
        { label: "Reinstall / Repair", sub: "Re-apply the patch to the same install" },
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

    if (installs.length === 0) {
        print(`  ${c.red("✗")} No Discord installations found.`);
        print(`  ${c.gray("Make sure Discord is installed and has been opened at least once.")}`);
        print();
        rl.close();
        return;
    }

    // Mark already-installed ones
    installs.forEach(i => {
        const already = isInstalled(i);
        i.label = `${i.name}${already ? c.green("  [Swancord installed]") : ""}`;
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
            await uninstall(chosen);
            stopSpinner(true, "Swancord patch removed successfully.");
        } catch (err) {
            stopSpinner(false, `Failed: ${err.message}`);
        }
    } else {
        // Build check
        const distDir = join(__dirname, "dist");
        if (!existsSync(join(distDir, "patcher.js"))) {
            print(`  ${c.yellow("⚠")}  dist/patcher.js not found. Building Swancord first...`);
            print();
            startSpinner("Building Swancord…");
            try {
                spawnSync("node", ["scripts/build/build.mjs"], {
                    cwd: __dirname,
                    stdio: "pipe",
                });
                stopSpinner(true, "Build complete.");
            } catch (err) {
                stopSpinner(false, `Build failed: ${err.message}`);
                rl.close();
                return;
            }
        }

        startSpinner("Patching Discord…");
        try {
            await install(chosen);
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

    if (!action.label.startsWith("Uninstall")) {
        print(`  ${c.green("✓")}  ${Bold("Swancord installed!")} Restart Discord to apply.`);
        print();
        print(`  ${c.gray("Tip:")} Open Discord Settings → Swancord to configure plugins and themes.`);
    } else {
        print(`  ${c.green("✓")}  ${Bold("Swancord removed.")} Restart Discord to apply.`);
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
