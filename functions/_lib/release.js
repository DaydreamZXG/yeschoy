// 最新公开版本。读 GitHub Release 里的 latest.json 和 SHA256SUMS.txt：
// 走下载地址，不走 GitHub API，不受匿名调用次数限制。边缘缓存 10 分钟。
export const REPO = "DaydreamZXG/yeschoy";
export const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;
const LATEST = `https://github.com/${REPO}/releases/latest/download`;

const INSTALLER = {
  windows: /-windows-x86_64-installer\.exe$/,
  mac: /-macos-universal-installer\.dmg$/,
};

async function fetchText(name) {
  const response = await fetch(`${LATEST}/${name}`, {
    headers: { "User-Agent": "yeschoy.app" },
    cf: { cacheTtl: 600, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`${name}: ${response.status}`);
  return response.text();
}

export async function latestRelease() {
  const [manifest, sums] = await Promise.all([
    fetchText("latest.json").then(JSON.parse),
    fetchText("SHA256SUMS.txt"),
  ]);
  const version = String(manifest.version || "").replace(/^v/, "");
  if (!version) throw new Error("latest.json has no version");
  const base = `https://github.com/${REPO}/releases/download/v${version}`;
  const files = sums
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter((parts) => parts.length === 2);
  const installers = {};
  for (const [platform, pattern] of Object.entries(INSTALLER)) {
    const entry = files.find(([, name]) => pattern.test(name));
    if (entry) {
      installers[platform] = { url: `${base}/${entry[1]}`, sha256: entry[0] };
    }
  }
  return {
    version,
    publishedAt: manifest.pub_date || null,
    notes: manifest.notes || "",
    page: `https://github.com/${REPO}/releases/tag/v${version}`,
    installers,
  };
}
