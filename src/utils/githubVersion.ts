let cached: { v: string; at: number } | null = null;

export async function getLatestSwancordVersion(): Promise<string> {
  // cache for 10 minutes (avoids rate limits + spam)
  if (cached && Date.now() - cached.at < 10 * 60 * 1000) return cached.v;

  const res = await fetch("https://api.github.com/repos/Brokaliy/Swancord/releases/latest", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Swancord"
    }
  });

  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const data = await res.json();

  // Prefer tag_name, fallback to name
  const raw = (data.tag_name || data.name || "0.0.0") as string;

  // Normalize: "v1.5.0" -> "1.5.0"
  const normalized = raw.trim().replace(/^v/i, "");

  cached = { v: normalized, at: Date.now() };
  return normalized;
}