# 站长接入指南：让你的站也能被 YesChoy 一键接上

**一句话：什么都不用改，你的站现在就能用 YesChoy。** 想让用户“浏览器点一下就登录、在客户端里看到余额和价格”，再按下面的方法打一个补丁。不用找我们登记，也不用付费。

## 用户那边是怎么接的

1. 用户从 [yeschoy.app](https://yeschoy.app/) 下载客户端，装好打开。
2. 在首页填你的站点网址，比如 `https://api.example.com`。第一次连某个站，客户端会弹窗请用户确认信任这个站。
3. 客户端会先看你的站有没有装“一键连接”：
   - **装了**：打开浏览器，用户在你的站上登录后点一下允许，就连上了。
   - **没装**：请用户粘贴一个在你站上建的密钥（`sk-…`）。客户端用它读出可用模型，就算连上了。
4. 用户挑一位“同学”（模型），选一个电脑上的 AI 应用（Claude Code、Codex、OpenCode 等），客户端自动把配置写好。

## 三种接法，选一种就行

| 你的站 | 要做什么 | 用户怎么连 | 用户能看到什么 |
|---|---|---|---|
| 任何兼容 OpenAI 接口的站 | 什么都不做 | 填网址 + 粘贴密钥 | 可用模型，能接各个应用 |
| [new-api](https://github.com/QuantumNous/new-api) | 打 [new-api 补丁](./patch/new-api-desktop-connect/) | 填网址 → 浏览器点一下 | 另外还有余额、价格方案和折扣、用量、公告，密钥自动建 |
| [sub2api](https://github.com/Wei-Shaw/sub2api) | 打 [sub2api 补丁](./patch/sub2api-desktop-connect/) | 同上 | 同上 |

两份补丁都是参考实现，还没并入 new-api 或 sub2api 上游。验证过哪些、没验证过哪些，补丁的 README 最后一节写得很清楚，上线前请先在测试环境试一遍。

## 接法一：什么都不改

你的站只要满足下面几条，用户就能连：

- 用户访问的地址是 **HTTPS + 域名**，用标准 443 端口。纯 IP、`http://`、带端口号的地址，客户端不会连。
- 用户的密钥能调 `GET /v1/models`，并且返回模型列表。new-api、one-api、sub2api 默认都可以。
- 列表里的模型名，要和你实际能调通的名字一致。

## 接法二：new-api 打补丁

```bash
cd new-api
git apply --check /path/to/desktop-connect.patch
git apply /path/to/desktop-connect.patch
# 然后照常构建、发布
```

不用改数据库，也不用加配置项。补丁是对哪个上游提交做的、打不上时手动改哪几处，见 [new-api 补丁说明](./patch/new-api-desktop-connect/README.md)。

## 接法三：sub2api 打补丁

```bash
cd sub2api
git checkout v0.2.25
git apply --check /path/to/desktop-connect.patch
git apply /path/to/desktop-connect.patch
# 然后照常构建 Docker 镜像
```

同样不用改数据库，也不用加配置项。sub2api 还要多做一步：**在后台「渠道管理」里配好渠道，并把渠道关联到分组。** 客户端里的方案和价格来自模型广场，没配渠道的分组在客户端里看不到。详见 [sub2api 补丁说明](./patch/sub2api-desktop-connect/README.md)。

## 打完补丁后，告诉用户可以这样连

- 在站点导航或控制台里加一个按钮，比如“连接客户端”，链接到 `https://你的站/desktop/connect`。这个页面是补丁自带的，装了客户端的用户点一下就能连上。
- 按钮旁边再放一个下载链接 `https://yeschoy.app/`，给还没装客户端的用户。

## 怎么确认接好了

1. 打开 `https://你的站/api/desktop/v2/bootstrap`，能看到 `"success": true` 就说明补丁生效了。
2. 用一个普通用户的账号，在客户端里填你的站点网址走一遍：能登录、看到余额和价格，接一个应用发一句话，再回你的站看使用记录有没有扣费。

## 常见问题

**客户端里看不到模型或方案**
- new-api：看这个用户能用的分组里有没有可用的模型。
- sub2api：看渠道有没有配，有没有关联到分组，模型有没有标价。没标价的模型不会出现在模型广场。

**检测时报 `model ... is not supported by any configured account in this group`**
请求的模型名和账号里写的模型名不一样，大小写和标点都算。比如对外叫 `DeepSeek-V4.1-Flash-1017`，上游叫 `deepseek-v4-1-flash-1017`。在账号的「模型映射」里加一行“对外名 → 上游名”就行。

**用户看到的价格单位不对**
new-api 补丁跟着站点的显示设置走：显示人民币就给人民币，其他情况给美元。sub2api 补丁一律给美元，和原版 sub2api 页面一致；如果你的站把余额当人民币用，要自己改补丁里 `desktop_data_handler.go` 的 `money`。

**要不要找 YesChoy 登记、要不要付费**
都不用。客户端认的是你的站点声明了什么接口，不看域名。

## 不要做的

- 不要把长期凭证（密钥、登录凭证）放进网址里。补丁只在网址里放一次性的连接码，5 分钟过期，只能用一次。
- 自己编译客户端时，远程模型目录（`YESCHOY_MODEL_CATALOG_URL`）不要填 YesChoy 官方的地址。要用就自己发布一份 https 的，或者留空用内置目录。
- 社区版的自动更新走 GitHub Releases，和你的站无关，不用管。

## 再往下看

- 补丁背后的接口约定：[`desktop-connect.md`](./desktop-connect.md)（登录后的数据接口）、[`station-connect-protocol.md`](./station-connect-protocol.md)（一键登录）、[`station-connect-api.openapi.yaml`](./station-connect-api.openapi.yaml)
- 自己从头实现接口时的安全检查表：[`station-connect-security-checklist.md`](./station-connect-security-checklist.md)

## 许可

两份补丁分别是 new-api（AGPL-3.0）和 sub2api（LGPL-3.0）的衍生作品，按各自上游的许可证提供，不适用本仓库的 MIT 许可。

---

## For station owners (English summary)

- **Any HTTPS station already works.** Users enter your URL and paste an API key; YesChoy lists models from `GET /v1/models`. Requirements: HTTPS on a domain (no IP, no custom port).
- **One-click sign-in** (balance, plans and discounts, usage and notices in the app, with keys created automatically): apply the reference patch for [new-api](./patch/new-api-desktop-connect/) or [sub2api](./patch/sub2api-desktop-connect/). No database changes, no new settings. Neither patch has been merged upstream yet, so try it on a test instance first.
- After patching, link `https://<your-station>/desktop/connect` from your site and send users to `https://yeschoy.app/` to download. Check `https://<your-station>/api/desktop/v2/bootstrap` returns `"success": true`.
- No registration or fee. The client recognises a station by what its bootstrap declares, not by its domain.
