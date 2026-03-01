// src/utils/githubVersion.ts

let cache: { v: string; at: number } | null = null;

function normalizeVersion(v: string) {
  return v.trim().replace(/^v/i, "");
}

/**
 * Primary: your website JSON (fast + reliable)
 * Fallback: GitHub API
 */
export async function getLatestSwancordVersion(): Promise<string> {
  const TTL = 5 * 60 * 1000;
  if (cache && Date.now() - cache.at < TTL) return cache.v;

  // ─────────────────────────────────────────
  // 1) Website JSON (MAIN SOURCE)
  // ─────────────────────────────────────────
  try {
    const res = await fetch("https://7n7.dev/swancord/changelog.json?ts=" + Date.now(), {
      cache: "no-store"
    });

    if (res.ok) {
      const data = await res.json();

      // must be array
      if (Array.isArray(data) && data.length > 0) {
        const v = data[0]?.version;

        if (typeof v === "string" && v.trim().length) {
          const out = normalizeVersion(v);
          cache = { v: out, at: Date.now() };
          return out;
        }
      }
    }
  } catch {
    // ignore and fallback
  }

  // ─────────────────────────────────────────
  // 2) GitHub fallback
  // ─────────────────────────────────────────
  try {
    const res = await fetch(
      "https://api.github.com/repos/Brokaliy/Swancord/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "SwancordClient"
        }
      }
    );

    if (res.ok) {
      const json = await res.json();
      const raw: string | undefined = json?.tag_name || json?.name;

      if (raw && raw.trim().length) {
        const out = normalizeVersion(raw);
        cache = { v: out, at: Date.now() };
        return out;
      }
    }
  } catch {
    // ignore
  }

  // ─────────────────────────────────────────
  // 3) fallback fallback
  // ─────────────────────────────────────────
  cache = { v: "devbuild", at: Date.now() };
  return cache.v;
}