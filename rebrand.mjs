import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".html", ".json", ".md"]);

function walk(dir) {
    for (const entry of readdirSync(dir)) {
        if (entry === "node_modules" || entry === ".git") continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walk(full);
        } else if (EXTS.has(extname(entry))) {
            let content = readFileSync(full, "utf8");
            const updated = content
                .replaceAll("VENCORD", "SWANCORD")
                .replaceAll("Vencord", "Swancord")
                .replaceAll("vencord", "swancord");
            if (updated !== content) {
                writeFileSync(full, updated, "utf8");
                console.log("updated:", full.replace(process.cwd() + "\\", ""));
            }
        }
    }
}

walk(".");
console.log("Done.");
