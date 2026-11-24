import { RELEASES_PAGE, latestRelease } from "../_lib/release.js";

export async function onRequestGet({ params }) {
  const release = await latestRelease().catch(() => null);
  const url = release?.installers[params.platform]?.url ?? RELEASES_PAGE;
  return Response.redirect(url, 302);
}
