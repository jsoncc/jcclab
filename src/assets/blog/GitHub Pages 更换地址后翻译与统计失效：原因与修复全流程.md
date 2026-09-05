---
title: GitHub Pages 更换地址后翻译与统计失效：原因与修复全流程
category: code-collaboration
tags:
  - GitHub
  - Pages
  - 部署
  - 排障
---

# GitHub Pages 更换地址后翻译与统计失效：原因与修复全流程
 
> 适用场景：`GitHub Pages + Cloudflare Worker + 前端 VITE 环境变量`。

---

## 一、背景

站点从旧路径迁移到新路径：

- 旧地址：`https://jsoncc.github.io/today-history/`
- 新地址：`https://jsoncc.github.io/jcclab/`

迁移后出现两个现象：

- 翻译模块报错：`Failed to fetch`
- 页脚统计报错：`全站统计暂时无法加载`

---

## 二、为什么会一起失效

本项目中，翻译和统计共用同一个 Worker 根地址：

- 翻译：请求 `VITE_BAIDU_TRANSLATE_URL`
- 统计：默认请求 `VITE_BAIDU_TRANSLATE_URL + /stats`（若未单独配置 `VITE_SITE_STATS_URL`）

所以只要 Worker 地址不可达、配置错误或注入失败，这两个功能会同时异常。

---

## 三、这次问题的根因

根因分两层（同时存在）：

1. **站点路径迁移后，线上接口配置未完全同步**
   - 前端已换到 `.../jcclab/`
   - 但 Worker 相关地址/白名单/Secrets 未完全与新环境一致

2. **Worker 名称仍是旧项目名**
   - 仍为 `today-history-baidu-proxy`
   - 功能可用但认知不一致，排查时容易误判“是不是还在走旧系统”

---

## 四、标准修复步骤（按顺序执行）

### 1）先确认 Worker 已部署且可访问

在项目根目录执行：

```bash
npm run workers:deploy
```

部署成功后记录终端输出的 Worker 根地址，例如：

```text
https://jcclab-baidu-proxy.896415482.workers.dev
```

### 2）更新 GitHub Actions Secrets

仓库路径：`Settings -> Secrets and variables -> Actions`

至少确认以下变量：

- `VITE_BAIDU_TRANSLATE_URL`
  - 例如：`https://jcclab-baidu-proxy.896415482.workers.dev`
- `VITE_SITE_STATS_URL`（可选，但建议显式配置）
  - 例如：`https://jcclab-baidu-proxy.896415482.workers.dev/stats`

> 若不配 `VITE_SITE_STATS_URL`，前端会自动用翻译地址拼 `/stats`。

### 3）触发 GitHub Pages 重新构建

因为 `VITE_*` 是构建期注入，必须重新构建才会生效。

可通过以下任一方式：

- 向 `main` 推送一次代码（自动触发）
- 在 Actions 手动 `Re-run` `Deploy to GitHub Pages`

### 4）发布后验证（3 项）

1. 直接访问：`https://<worker-domain>/stats` 返回 JSON  
2. 页面底部统计恢复显示 PV/UV  
3. 翻译模块不再出现 `Failed to fetch`

---

## 五、为什么要改 Worker 名称

旧名 `today-history-baidu-proxy` 虽可继续使用，但与当前项目 `jcclab` 不一致，长期会造成：

- 排查混乱（看网络请求像旧项目）
- 团队协作成本上升（文档、脚本、Secrets 语义不统一）

因此将 Worker 名改为：

- `jcclab-baidu-proxy`

---

## 六、修改 Worker 名称的标准做法

### 1）改配置文件

文件：`workers/wrangler.toml`

- `name = "jcclab-baidu-proxy"`

### 2）同步脚本中的默认名称

文件：`scripts/worker-kv-bind.ts`

- 将脚本里写死的旧名称改为新名称常量，避免后续执行脚本时回写旧名

### 3）重新部署 Worker

```bash
npm run workers:deploy
```

记录新地址并更新 Secrets（同第四节）。

---

## 七、最终状态（目标）

当下面条件同时成立，说明迁移完成：

- 前端地址：`https://jsoncc.github.io/jcclab/`
- Worker 地址：`https://jcclab-baidu-proxy.<account>.workers.dev`
- `VITE_BAIDU_TRANSLATE_URL` 指向新 Worker 根地址
- 翻译与统计都正常

---

## 八、经验总结（可复用）

每次“换域名/换路径/换项目名”后，固定检查这 4 项：

1. Worker 是否可达（尤其 `/stats`）
2. GitHub Secrets 是否更新
3. Pages 是否重建成功
4. Worker 名称、脚本默认名、文档是否一致

做到这四步，类似问题基本可以一次解决。
