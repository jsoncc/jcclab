# 开发者指南

本文档面向项目的开发者与维护者，包含技术栈细节、仓库结构、部署配置等内容。

---

## 环境要求

- **Node.js** ≥ 18.0.0（推荐 LTS）
- **npm** ≥ 9（随 Node.js 18+ 自带）
- `package.json` 已声明 `engines.node`，Node.js 版本过低时 npm 会发出警告

## 技术栈

- **前端**：Vue 3、TypeScript、Vite 5、`@vitejs/plugin-vue`
- **Markdown**：`marked`（博客 MD → HTML、历史/VPN 弹窗渲染）
- **翻译签名**：`crypto-js`（MD5）
- **图标**：`@iconify/vue` + `@iconify-icons/mdi` + `@iconify-icons/radix-icons`
- **PDF 处理**：`pdfjs-dist`（PDF → 图片）、`docx` + `jszip`（PDF → Word）
- **农历**：`lunar-javascript`、`solarlunar`
- **繁简转换**：`opencc-js`
- **构建前脚本**：`tsx` 执行 `scripts/generate-blog-meta.ts`（博客元数据）和 `scripts/convert-md-to-html.ts`（MD → HTML）
- **每日历史生成**：`scripts/generate-history-daily.ts`（拉取维基百科 + 百度百科，自动生成当日历史 Markdown）
- **邮件推送**：`scripts/send-history-mail.ts`（nodemailer，SMTP 发送历史内容）
- **可选边缘**：`workers/site-worker.ts` + Wrangler（翻译 POST 转发 + 可选 KV 统计 `/stats`）
- **CI/CD**：GitHub Actions → GitHub Pages（见 `.github/workflows/deploy.yml`）；每日历史生成与邮件推送（见 `.github/workflows/history-daily-mail.yml`）

---

## 仓库结构

```text
.
├─ index.html                 # 入口 HTML，挂载 src/main.ts
├─ package.json
├─ vite.config.ts             # Vite：base 相对路径（GitHub Pages）；开发期 /baidu-fanyi 代理
├─ tsconfig.json              # 含 src、scripts、workers、vite.config
├─ scripts/
│  ├─ generate-blog-meta.ts   # 生成 src/assets/blog/blog-meta.json（Git 时间 / mtime 兜底）
│  ├─ convert-md-to-html.ts   # 批量将 blog/*.md 转为 blog/html/*.html
│  ├─ generate-history-daily.ts # 联网生成「历史上的今天」Markdown（Wikipedia + 百度百科）
│  ├─ send-history-mail.ts    # 通过 SMTP 发送历史内容邮件
│  └─ worker-kv-bind.ts       # 一键创建/关联 Cloudflare KV 命名空间
├─ src/
│  ├─ main.ts                 # createApp 入口
│  ├─ env.d.ts                # Vite 环境变量、*.vue 类型声明
│  ├─ App.vue / App.css       # 页面布局、侧栏导航、翻译、主题切换、全站搜索
│  ├─ components/
│  │  ├─ MarkdownViewer.vue   # Markdown 弹窗阅读、图片路径解析
│  │  ├─ JsonFormatValidator.vue
│  │  ├─ UuidGenerator.vue
│  │  ├─ MyBatisSqlFormatter.vue
│  │  ├─ Base64Decoder.vue
│  │  ├─ Base64FileTool.vue
│  │  ├─ FileToBase64Tool.vue
│  │  ├─ Base64ToFileTool.vue
│  │  ├─ PdfTools.vue         # PDF 转图片 / 转 Word
│  │  ├─ PdfToImage.vue
│  │  ├─ PdfToWord.vue
│  │  └─ PerpetualCalendar.vue # 万年历
│  ├─ types/
│  │  └─ opencc-js.d.ts
│  └─ assets/
│     ├─ history/             # history-YYYY-MM-DD.md（自动生成）
│     ├─ blog/                # *.md + blog-meta.json（脚本生成，勿手改）+ html/*.html
│     ├─ command/             # 已隐藏，内容已拆分到博客模块
│     ├─ vpn/                 # 已隐藏
│     └─ images/              # 文内引用 ./images/...
├─ workers/
│  ├─ site-worker.ts          # Worker 入口：百度翻译 POST + GET /stats（KV）
│  ├─ stats.ts                # /stats 逻辑（PV +1 / UV Cookie 去重）
│  ├─ README.md               # KV 绑定与部署说明
│  └─ wrangler.toml
├─ types/
│  └─ lunar-javascript.d.ts   # lunar-javascript 类型声明
├─ docs/
│  ├─ DEVELOPMENT.md          # 本文件：开发者指南
│  └─ history-mail-setup.md   # 每日历史邮件配置说明
├─ .github/workflows/
│  ├─ deploy.yml              # 推送 main → 构建部署到 GitHub Pages
│  └─ history-daily-mail.yml  # 每日 UTC 12:00（北京时间 20:00）生成历史并邮件推送
└─ .env.example               # 本地/CI 环境变量模板
```

---

## 翻译与生产环境

**开发**：浏览器请求同源路径 `/baidu-fanyi`，由 Vite 代理到 `https://fanyi-api.baidu.com`，避免 CORS。

**生产（GitHub Pages）**：静态托管没有 Node 代理；浏览器不能直接跨域调百度接口。需把 **`VITE_BAIDU_TRANSLATE_URL`** 设为可公网访问的 Worker 根地址（本仓库 `workers/site-worker.ts`）。全站 **PV/UV** 为同一 Worker 的 **`GET /stats`**，需在 Worker 绑定 KV（见 `workers/README.md`）。

```bash
npx wrangler login
npm run workers:deploy
```

（统计用 KV：若尚未写入 `workers/wrangler.toml`，可先 `npm run workers:kv-bind`；该命令用 **`tsx`** 执行 **`scripts/worker-kv-bind.ts`**。）详见 `workers/README.md`。

Worker **不保存**你的 appid/secret；签名仍由前端用环境变量计算，与当前实现一致。

---

## GitHub Pages 部署

推送到 **`main`** 时，`.github/workflows/deploy.yml` 会 `npm ci`、注入 Secrets 后 `npm run build`，并发布到 Pages。

在仓库 **Settings → Secrets and variables → Actions** 中建议配置：

- `VITE_BAIDU_APP_ID`
- `VITE_BAIDU_SECRET`
- `VITE_BAIDU_TRANSLATE_URL`（Worker 根地址；翻译与页脚统计同源，`/stats` 走 KV）
- （可选）`VITE_SITE_STATS_URL`：若统计与翻译不在同一 Worker，可填完整 `https://…/stats` 覆盖默认的「翻译 URL + `/stats`」

---

## 每日历史生成与邮件推送

`.github/workflows/history-daily-mail.yml` 每天北京时间 20:00（UTC 12:00）自动：

1. 拉取维基百科 + 百度百科当日数据，生成 `src/assets/history/history-YYYY-MM-DD.md`
2. 自动 `git commit` + `git push` 提交生成的文件
3. 通过 SMTP 发送邮件到指定收件箱

邮件相关 Secrets（在仓库 Settings → Secrets 中配置）：

- `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`
- `HISTORY_MAIL_TO`、`HISTORY_MAIL_FROM`

详见 [`history-mail-setup.md`](history-mail-setup.md)。

---

## 内容维护

### 历史上的今天

- 目录：`src/assets/history/`
- 文件名：`history-YYYY-MM-DD.md`
- 首页按日期**新→旧**展示
- 自动生成：`npm run history:generate`（可选 `TARGET_DATE=2026-06-05` 指定日期）

### 博客

- 目录：`src/assets/blog/`
- 任意可读文件名 + `.md` 即可被扫描到
- 构建时自动转为 `html/*.html`（`scripts/convert-md-to-html.ts`）
- **排序**：依赖 `blog-meta.json`（路径 → Unix 秒），由 `scripts/generate-blog-meta.ts` 根据 **Git 最后一次提交该文件的时间** 生成；无 Git 信息时用文件修改时间

### 文内图片

- 资源放在 `src/assets/images/...`
- Markdown 中写法：`./images/...`（如 `![示例](./images/blog/demo.png)`）
- 弹窗阅读器会把相对路径解析为打包后的资源 URL

### 导航与布局

- **全部**：各模块卡片同时出现
- **单模块**：只显示当前模块；主区域高度加大，适合长文
- **工具集合**：悬停展开子菜单（JSON 工具 / UUID / MyBatis SQL / Base64 / PDF），避免侧栏裁切会挂到 `body`
