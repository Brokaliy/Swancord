// src/utils/githubVersion.ts

let cache: { v: string; at: number } | null = null;

function normalizeVersion(input: string): string {
  // "v1.17.0" -> "1.17.0"
  return input.trim().replace(/^v/i, "");
}

export async function getLatestSwancordVersion(): Promise<string> {
  // Cache for 10 minutes to avoid GitHub rate-limit spam
  const TTL = 10 * 60 * 1000;
  if (cache && Date.now() - cache.at < TTL) return cache.v;

  const url = "https://api.github.com/repos/Brokaliy/Swancord/releases/latest";

  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Swancord"
    }
  });

  if (!res.ok) {
    // If rate limited or API down, keep it graceful
    cache = { v: "Unknown", at: Date.now() };
    return cache.v;
  }

  const data = await res.json();

  // Prefer tag_name; fallback to name
  const raw: string = data?.tag_name || data?.name || "Unknown";
  const v = raw === "Unknown" ? "Unknown" : normalizeVersion(raw);

  cache = { v, at: Date.now() };
  return v;
}