# yeschoy.app：落地页、下载页、一键连接页

整站是 `public/` 目录里的静态文件，放在中转站那台服务器的 nginx 上（`/var/www/yeschoy-app`，
配置见 [`deploy/yeschoy-app/nginx.conf`](../deploy/yeschoy-app/nginx.conf)）。

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

[`deploy/yeschoy-app/refresh-release.py`](../deploy/yeschoy-app/refresh-release.py) 每 10 分钟跑一次
（`/etc/cron.d/yeschoy-app`）：先读 `releases/latest/download/latest.json` 拿版本号，再读该版本的
`SHA256SUMS.txt` 拿安装包文件名，写出 `/api/latest.json` 和 nginx 片段
`/etc/nginx/snippets/yeschoy-app-dl.conf`（`/dl/windows`、`/dl/mac` 的 302），变了才重载 nginx。
不调 GitHub API。读失败时保留上一次的结果。发新版后不用改页面。

应用内自动更新与本站无关，社区版直接读 GitHub Release 的 `latest.json`。

## 部署

```bash
rsync -a --delete --exclude api/ public/ 服务器:/var/www/yeschoy-app/
# 首次：nginx.conf → /etc/nginx/conf.d/yeschoy-app.conf，refresh-release.py → /opt/yeschoy-app/，
# cron → /etc/cron.d/yeschoy-app，再手动跑一次 refresh-release.py
```
