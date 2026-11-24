#!/usr/bin/env python3
"""每 10 分钟跑一次：读 GitHub 上最新 Release，生成 /api/latest 和 /dl/* 的跳转。

latest.json 给出版本号，再读那个版本的 SHA256SUMS.txt 拿安装包文件名。
只在内容变了时才写文件、重载 nginx。
"""
import json
import pathlib
import re
import subprocess
import sys
import urllib.request

REPO = "DaydreamZXG/yeschoy"
RELEASES_PAGE = f"https://github.com/{REPO}/releases/latest"
WEB_ROOT = pathlib.Path("/var/www/yeschoy-app")
SNIPPET = pathlib.Path("/etc/nginx/snippets/yeschoy-app-dl.conf")
INSTALLER = {
    "windows": re.compile(r"-windows-x86_64-installer\.exe$"),
    "mac": re.compile(r"-macos-universal-installer\.dmg$"),
}


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "yeschoy.app"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.read().decode()


def latest_release():
    manifest = json.loads(fetch(f"{RELEASES_PAGE}/download/latest.json"))
    version = str(manifest.get("version") or "").removeprefix("v")
    if not version:
        raise ValueError("latest.json has no version")
    base = f"https://github.com/{REPO}/releases/download/v{version}"
    files = [line.split() for line in fetch(f"{base}/SHA256SUMS.txt").splitlines()]
    installers = {}
    for platform, pattern in INSTALLER.items():
        for parts in files:
            if len(parts) == 2 and pattern.search(parts[1]):
                installers[platform] = {"url": f"{base}/{parts[1]}", "sha256": parts[0]}
                break
    return {
        "version": version,
        "publishedAt": manifest.get("pub_date"),
        "notes": manifest.get("notes", ""),
        "page": f"https://github.com/{REPO}/releases/tag/v{version}",
        "installers": installers,
    }


def snippet(release):
    lines = [f"# 由 refresh-release.py 生成：v{release['version']}"]
    for platform, item in release["installers"].items():
        lines.append(f"location = /dl/{platform} {{ return 302 {item['url']}; }}")
    lines.append(f"location ^~ /dl/ {{ return 302 {RELEASES_PAGE}; }}")
    return "\n".join(lines) + "\n"


def write_if_changed(path, text):
    if path.exists() and path.read_text() == text:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text)
    return True


def main():
    release = latest_release()
    write_if_changed(WEB_ROOT / "api" / "latest.json", json.dumps(release, ensure_ascii=False))
    if write_if_changed(SNIPPET, snippet(release)):
        subprocess.run(["nginx", "-t", "-q"], check=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # 读不到就保留上一次的结果
        print(f"refresh-release: {error}", file=sys.stderr)
        sys.exit(1)
