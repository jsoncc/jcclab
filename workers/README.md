# Cloudflare Worker（翻译 + 全站统计）

入口：`site-worker.ts`，配置：`wrangler.toml`（已绑定 KV `SITE_STATS`）。

| 路径 | 方法 | 说明 |
|------|------|------|
| `/` 等 | `POST` | 转发百度翻译（与原先一致） |
| `/stats` | `GET` | 总访问量（PV）与总访客（UV），数据存 **KV** |

## 推荐：在项目根目录用 npm 脚本

（首次）登录 Cloudflare：

```bash
npx wrangler login
```

**一键创建/关联 KV 并写入 `wrangler.toml`**（命名空间已存在时会自动 `kv namespace list` 取 id）：

```bash
npm run workers:kv-bind
```

（实现为项目根下的 **`scripts/worker-kv-bind.ts`**，通过 **`tsx`** 运行，与 `generate-blog-meta` 等脚本一致。）

**部署 Worker**（读取 `workers/wrangler.toml`）：

```bash
npm run workers:deploy
```

**本地调试 Worker**：

```bash
npm run workers:dev
```

另开终端在项目根执行 `npm run dev`，前端会通过 Vite 把 `/site-stats` 代理到本机 Wrangler 的 `/stats`。

## GitHub Pages / Secrets

将 **Worker 根 URL**（`npm run workers:deploy` 成功后在终端输出的 `https://….workers.dev`，**不要**末尾斜杠）配置到：

- 本地：`.env` 的 `VITE_BAIDU_TRANSLATE_URL`
- CI：`VITE_BAIDU_TRANSLATE_URL`（仓库 Actions Secrets）

页脚统计使用 **同一 URL + `/stats`**，一般不必再配 `VITE_SITE_STATS_URL`。

## 手动维护（可选）

- 创建 KV：`npx wrangler kv namespace create SITE_STATS`（在项目根可加 `--config workers/wrangler.toml` 且 `cwd` 为 `workers` 时与脚本等价）
- id 在 Cloudflare 控制台为 **32 位十六进制** 或带横线 UUID，粘贴到 `wrangler.toml` 的 `id = "…"` 即可。

## 复制本仓库的其它开发者

`wrangler.toml` 里的 `id` 绑定的是**原账号**的 KV；Fork 或换账号后请在本机执行 `npm run workers:kv-bind` 生成自己的命名空间并覆盖 `id`，再 `npm run workers:deploy`。

## UV 说明

访客 Cookie 种在 **Worker 域名**（`*.workers.dev`）上，且需 `credentials: 'include'` 与 CORS 白名单。第三方 Cookie 策略过严时 UV 可能不准；PV 每次打开页面仍会 +1。
