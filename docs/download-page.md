# yeschoy.app：落地页、下载页、一键连接页

整站是 `public/` 目录里的静态文件，加上 `functions/` 里的两个 Cloudflare Pages Functions，
部署在 Cloudflare Pages（项目根目录 = 仓库根目录，输出目录 = `public`，不需要构建命令）。

## 路径

| 路径 | 内容 |
| --- | --- |
| `/` | 落地页：九个角色、三步开始、能接的应用、下载、开源与隐私（[`public/index.html`](../public/index.html)） |
| `/download/` | 精简下载页，客户端和一键连接页的“下载”都指向这里 |
| `/desktop/connect` | 站点一键连接页（[`station-connect-embed.md`](./station-connect-embed.md)） |
| `/dl/windows`、`/dl/mac` | 302 跳到 GitHub 最新正式版的安装包；读不到就跳 Releases 页 |
| `/api/latest` | 最新版的 `version`、`publishedAt`、`notes` 和两个安装包的地址与 SHA-256 |
| `/download.js`、`/connect.js` | 给站点嵌入用的脚本（`pnpm build:download` / `pnpm build:connect`） |

页面样式和脚本在 `public/site/`：`landing.css`、`landing.js`，角色立绘是
`src/assets/roster/portrait` 缩到 480×720 的副本，应用图标从 `src/assets/icons` 复制。

## 下载地址怎么来

[`functions/_lib/release.js`](../functions/_lib/release.js) 读最新 Release 的
`latest.json`（版本号）和 `SHA256SUMS.txt`（安装包文件名），都走
`github.com/…/releases/latest/download/`，不调 GitHub API，所以不受匿名调用次数限制。
结果在 Cloudflare 边缘缓存 10 分钟。发新版后不用改页面。

应用内自动更新与本站无关，社区版直接读 GitHub Release 的 `latest.json`。

## 本地预览

```bash
npx wrangler pages dev public --port 8788
# http://127.0.0.1:8788/  /download/  /desktop/connect  /dl/windows  /api/latest
```
