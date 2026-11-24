import { latestRelease } from "../_lib/release.js";

export async function onRequestGet() {
  const release = await latestRelease().catch(() => null);
  if (!release) return Response.json({ error: "unavailable" }, { status: 502 });
  return Response.json(release, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
