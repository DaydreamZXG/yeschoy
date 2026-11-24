(() => {
  const ROSTER = [
    ["cla", "Claude", "橘子", "#ff9a4d", "别急，你把事说清楚，剩下的我来收尾。", ["……正看到精彩的地方，有事直说。", "你说得对……但代码我还是得再看一眼。", "行了行了，知道你手痒。"]],
    ["gpt", "GPT", "阿青", "#36d68a", "啥活都能接，稳着呢。", ["在呢，刚泡好茶，说吧。", "戳我干嘛，又卡壳了？", "放心，我不嫌你问题多。"]],
    ["gem", "Gemini", "小星", "#b58cff", "眼睛借我，图和长文都交给我扫！", ["诶哟，被你逮着了！", "扔张图或者甩篇长文过来，秒看懂。", "再戳我就真要抢着干活了哦。"]],
    ["grk", "Grok", "小黑", "#e6e9f0", "就这？行吧，看我的。", ["手挺闲啊，没活干了？", "外头刚出啥新鲜事，问我就对了。", "行了，算我陪你唠两句。"]],
    ["ds", "DeepSeek", "小鲸", "#4fb8ff", "吃饱喝足，这就开工！", ["刚端起碗呢，测完记得喊我。", "便宜归便宜，活可一点不含糊！", "别戳了别戳了，汤要洒啦！"]],
    ["qw", "Qwen", "千问", "#9b6bff", "想不通的、查不到的，都丢给我！", ["干嘛戳我，是想到新点子了？", "等等，顺着这个我又想到三个路子！", "对了，鲸鱼干嘛老惦记着干饭呀？"]],
    ["kimi", "Kimi", "月月", "#5aa2ff", "……两百万字？放桌角吧，我醒了就看。", ["……嗯？到点了？", "再眯五分钟，就五分钟……", "翻完最后两页就睡。"]],
    ["glm", "GLM", "小谱", "#3b6bff", "放心交给我，这波奔着满分去。", ["别闹，这行逻辑正对到关键处呢。", "喏，顺手帮你圈出两个小坑。", "下次评比第一肯定还是我。"]],
    ["dou", "豆包", "豆包", "#ff9ec4", "说句大白话：这事包我身上。", ["哎，在呢在呢！", "老实交代，刚才在摸鱼，现在立刻开工。", "聊正事唠闲嗑都行，我接得住。"]],
  ];

  const list = document.querySelector("[data-roster]");
  if (list) {
    for (const [id, brand, name, color, quote, pokes] of ROSTER) {
      const item = document.createElement("li");
      item.style.setProperty("--c", color);
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `${name}（${brand}）`);
      const img = document.createElement("img");
      img.src = `/site/roster/${id}.webp`;
      img.alt = "";
      img.loading = "lazy";
      img.width = 480;
      img.height = 720;
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.innerHTML = `<b></b><small></small>`;
      tag.querySelector("b").textContent = name;
      tag.querySelector("small").textContent = brand;
      const line = document.createElement("q");
      line.textContent = quote;
      line.setAttribute("aria-live", "polite");
      let turn = 0;
      button.addEventListener("click", () => {
        line.textContent = pokes[turn % pokes.length];
        turn += 1;
        item.classList.remove("poked");
        void item.offsetWidth;
        item.classList.add("poked");
      });
      button.append(img, tag, line);
      item.append(button);
      list.append(item);
    }
  }

  const ua = navigator.userAgent || "";
  const platform = /iPhone|iPad|Android/i.test(ua) ? null : /Mac/i.test(ua) ? "mac" : /Windows/i.test(ua) ? "windows" : null;
  if (platform === "mac") {
    const main = document.querySelector(".btn-main");
    const alt = document.querySelector(".btn-alt");
    if (main && alt) {
      main.href = "/dl/mac";
      main.dataset.dl = "mac";
      main.querySelector("[data-dl-label]").textContent = "下载 Mac 版";
      alt.href = "/dl/windows";
      alt.dataset.dl = "windows";
      alt.textContent = "下载 Windows 版";
    }
  }
  if (platform) {
    document.querySelector(`.dl-card[data-dl="${platform}"]`)?.classList.add("is-mine");
  }

  const mb = (bytes) => `${Math.round(bytes / 1048576)} MB`;
  fetch("/api/latest", { headers: { Accept: "application/json" } })
    .then((response) => (response.ok ? response.json() : null))
    .then((release) => {
      if (!release?.version) return;
      for (const node of document.querySelectorAll("[data-version]")) {
        node.textContent = `v${release.version}`;
      }
      const line = document.querySelector("[data-release-line]");
      if (line) {
        const day = release.publishedAt ? new Date(release.publishedAt).toLocaleDateString("zh-CN") : "";
        line.textContent = `最新版 v${release.version}${day ? `，${day} 发布` : ""}。从 GitHub 下载。`;
      }
      for (const [key, info] of Object.entries(release.installers || {})) {
        const node = document.querySelector(`[data-size="${key}"]`);
        if (node && info.size) node.textContent += ` · ${mb(info.size)}`;
      }
    })
    .catch(() => {});
})();
