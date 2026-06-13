# JsonCC Lab

个人静态站点 **JsonCC Lab**（仓库目录名仍为 `jcclab`，线上路径不变）。基于 **Vue 3 + TypeScript + Vite** 构建，Markdown 内容随仓库维护，部署在 GitHub Pages。

在线地址：<https://jsoncc.github.io/jcclab/>

---

## 功能一览

| 模块 | 说明 |
|------|------|
| 历史上的今天 | `src/assets/history/` 下按日期的 `.md`，首页按日期倒序列出；每日定时自动生成并邮件推送 |
| 博客 | `src/assets/blog/` 下的 `.md`，构建时转为 HTML；博客列表按 Git 最后提交时间排序 |
| 翻译 | 百度翻译通用 API；开发走 Vite 代理，生产需可访问的转发地址（如 Cloudflare Worker） |
| 工具集合 | JSON 格式化校验、UUID 批量生成、MyBatis SQL 日志格式化、Base64 编解码、Base64 转文件、PDF 转图片/转 Word |
| 万年历 | 农历、节气、节日查询 |
| 导航 | 左侧「全部 / 单模块」切换；单模块时主区域拉高便于阅读 |
| 全站搜索 | 顶栏输入关键词，实时匹配工具、历史、博客等模块内容 |
| 主题切换 | 8 套预设主题（极简白、深海蓝、暮光紫、晨雾绿、暖阳橙、冰雪蓝、玫瑰粉、暗夜黑） |
| 页脚统计 | 总访问量（PV）/ 总访客（UV），请求 Worker `GET /stats`（需 KV，见 `workers/README.md`） |

---

## 快速开始

### 1. 环境要求

- **Node.js** ≥ 18.0.0（推荐 LTS）

### 2. 安装依赖

```bash
npm install
```

### 3. 环境变量

复制 `.env.example` 为 `.env`，按需填写：

```env
VITE_BAIDU_APP_ID=你的百度翻译_APP_ID
VITE_BAIDU_SECRET=你的百度翻译密钥
# 可选：本地模拟生产时填已部署的 Worker 根地址（不要末尾多余斜杠也可）
# VITE_BAIDU_TRANSLATE_URL=https://xxx.workers.dev
```

### 4. 本地开发

```bash
npm run dev        # 仅启动开发服务器
npm run dev:full   # 同时启动开发服务器 + Worker（含页脚统计）
```

### 5. 生产构建与预览

```bash
npm run build    # 先类型检查（vue-tsc），再 vite build，产出 dist/
npm run preview  # 本地预览 dist
```

---

## npm 脚本

| 脚本 | 作用 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run dev:full` | 启动开发服务器 + Worker（含页脚统计） |

---

## 界面预览

![首页导航](./src/assets/images/home/1.png)
![首页导航](./src/assets/images/home/3.png)

---

## 安全提示

- 勿将 `.env` 提交进仓库
- `.env.example` 只保留变量名说明，不要写真实密钥
- 密钥若曾泄露，请在百度翻译开放平台重置

---

## 更多文档

- [开发者指南](docs/DEVELOPMENT.md) — 技术栈、仓库结构、部署配置、内容维护等详细说明
- [每日历史邮件配置](docs/history-mail-setup.md) — 定时任务与 SMTP 配置
- [Cloudflare Worker 说明](workers/README.md) — KV 绑定、部署与调试
