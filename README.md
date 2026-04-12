# JsonCC Lab

个人静态站点 **JsonCC Lab**（仓库目录名仍为 `today-history`，线上路径不变）。基于 **Vue 3 + TypeScript + Vite** 构建，Markdown 内容随仓库维护，部署在 GitHub Pages。

在线地址：<https://jsoncc.github.io/today-history/>

---

## 功能一览

| 模块 | 说明 |
|------|------|
| 历史上的今天 | `src/assets/history/` 下按日期的 `.md`，首页按日期倒序列出 |
| 博客 / 命令 / VPN | 对应 `blog`、`command`、`vpn` 目录扫描 `.md`；博客列表按 Git 最后提交时间排序 |
| 翻译 | 百度翻译通用 API；开发走 Vite 代理，生产需可访问的转发地址（如 Cloudflare Worker） |
| 工具集合 | JSON 格式化校验、UUID 批量生成 |
| 导航 | 左侧「全部 / 单模块」切换；单模块时主区域拉高便于阅读 |
| 页脚统计 | 总访问量（PV）/ 总访客（UV），请求 Worker `GET /stats`（需 KV，见 `workers/README.md`） |

---

## 技术栈

- **前端**：Vue 3、TypeScript、Vite 5、`@vitejs/plugin-vue`
- **Markdown**：`marked`
- **翻译签名**：`crypto-js`（MD5）
- **构建前脚本**：`tsx` 执行 `scripts/generate-blog-meta.ts`，生成博客更新时间元数据
- **可选边缘**：`workers/site-worker.ts` + Wrangler（翻译 POST 转发 + 可选 KV 统计 `/stats`）
- **CI/CD**：GitHub Actions → GitHub Pages（见 `.github/workflows/deploy.yml`）

---

## 仓库结构

```text
.
├─ index.html                 # 入口 HTML，挂载 src/main.ts
├─ package.json
├─ vite.config.ts             # Vite：base 相对路径（GitHub Pages）；开发期 /baidu-fanyi 代理
├─ tsconfig.json              # 含 src、scripts、workers、vite.config
├─ scripts/
│  └─ generate-blog-meta.ts   # 生成 src/assets/blog/blog-meta.json（Git 时间 / mtime 兜底）
├─ src/
│  ├─ main.ts                 # createApp 入口
│  ├─ env.d.ts                # Vite 环境变量、*.vue 类型
│  ├─ App.vue / App.css       # 页面布局与全局样式
│  ├─ components/
│  │  ├─ MarkdownViewer.vue   # Markdown 弹窗阅读、图片路径解析
│  │  ├─ JsonFormatValidator.vue
│  │  └─ UuidGenerator.vue
│  └─ assets/
│     ├─ history/             # history-YYYY-MM-DD.md
│     ├─ blog/                # *.md；blog-meta.json 勿手改（脚本生成）
│     ├─ command/
│     ├─ vpn/
│     └─ images/              # 文内引用 ./images/...
├─ workers/
│  ├─ site-worker.ts          # Worker 入口：百度翻译 POST + GET /stats（KV）
│  ├─ stats.ts                # /stats 逻辑
│  ├─ README.md               # KV 绑定与部署说明
│  └─ wrangler.toml
├─ .github/workflows/deploy.yml
└─ .env.example               # 本地/CI 环境变量模板
```

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境变量

复制 `.env.example` 为 `.env`，按需填写：

```env
VITE_BAIDU_APP_ID=你的百度翻译_APP_ID
VITE_BAIDU_SECRET=你的百度翻译密钥
# 可选：本地模拟生产时填已部署的 Worker 根地址（不要末尾多余斜杠也可）
# VITE_BAIDU_TRANSLATE_URL=https://xxx.workers.dev
```

### 3. 本地开发

```bash
npm run dev
```

`predev` 会先执行 `generate-blog-meta.ts`，再启动 Vite（默认端口见 `vite.config.ts`，一般为 3000）。

### 4. 生产构建与预览

```bash
npm run build    # 先类型检查（vue-tsc），再 vite build，产出 dist/
npm run preview  # 本地预览 dist（与 dev 相同可使用 /baidu-fanyi 代理配置）
```

---

## npm 脚本

| 脚本 | 作用 |
|------|------|
| `npm run dev` | `tsx` 刷新博客元数据 → 启动开发服务器 |
| `npm run build` | `tsx` 刷新博客元数据 → `vue-tsc --noEmit` → `vite build` |
| `npm run preview` | 预览 `dist` |
| `npm run typecheck` | 仅运行 `vue-tsc --noEmit`，不打包 |

手动只刷新博客元数据（通常不必，`dev`/`build` 已自动跑）：

```bash
npx tsx scripts/generate-blog-meta.ts
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

## 内容维护

### 历史上的今天

- 目录：`src/assets/history/`
- 文件名：`history-YYYY-MM-DD.md`
- 首页按日期**新→旧**展示

### 博客、命令、VPN

- 目录：`src/assets/blog/`、`command/`、`vpn/`
- 任意可读文件名 + `.md` 即可被扫描到
- **博客排序**：依赖 `blog-meta.json`（路径 → Unix 秒），由 `scripts/generate-blog-meta.ts` 根据 **Git 最后一次提交该文件的时间** 生成；无 Git 信息时用文件修改时间
- **科学上网**单模块视图：内联展示列表**第一项**的正文（列表与内联均按文件名字符串**降序**排列，非按文件日期）

### 文内图片

- 资源放在 `src/assets/images/...`
- Markdown 中写法：`./images/...`（如 `![示例](./images/blog/demo.png)`）
- 弹窗阅读器会把相对路径解析为打包后的资源 URL

### 导航与布局

- **全部**：各模块卡片同时出现
- **单模块**：只显示当前模块；主区域高度加大，适合长文
- **工具集合**：悬停展开子菜单（JSON 工具 / UUID），避免侧栏裁切会挂到 `body`

---

## 界面预览

![首页导航](./src/assets/images/home/1.png)
![首页导航](./src/assets/images/home/2.png)
![首页导航](./src/assets/images/home/3.png)

---

## 安全提示

- 勿将 `.env` 提交进仓库
- `.env.example` 只保留变量名说明，不要写真实密钥
- 密钥若曾泄露，请在百度翻译开放平台重置
