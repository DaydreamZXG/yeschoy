import { RELEASES_PAGE, latestRelease } from "./release.js";

async function latest() {
  const release = await latestRelease().catch(() => null);
  if (!release) return Response.json({ error: "unavailable" }, { status: 502 });
  return Response.json(release, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}

async function download(platform) {
  const release = await latestRelease().catch(() => null);
  return Response.redirect(release?.installers[platform]?.url ?? RELEASES_PAGE, 302);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/latest") return latest();
    const platform = pathname.match(/^\/dl\/([^/]+)\/?$/)?.[1];
    if (platform) return download(platform);
    return env.ASSETS.fetch(request);
  },
};
