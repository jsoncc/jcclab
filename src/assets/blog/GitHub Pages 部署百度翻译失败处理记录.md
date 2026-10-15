---
category: code-collaboration
title: GitHub Pages 百度翻译部署与密钥安全迁移记录
tags:
  - GitHub
  - Pages
  - 翻译
  - 安全
---

# GitHub Pages 百度翻译部署与密钥安全迁移记录

## 1. 问题背景

GitHub Pages 是静态托管，浏览器不能直接调用不支持 CORS 的百度翻译接口，因此需要腾讯云 SCF 作为中转。

旧实现把 `VITE_BAIDU_APP_ID` 与 `VITE_BAIDU_SECRET` 注入 GitHub Actions 构建。所有 `VITE_*` 变量都会进入浏览器 JavaScript，Secret 名称不会让它变成私密数据；这会导致百度密钥和签名算法暴露。

## 2. 最终方案

```text
GitHub Pages 浏览器 -- { q, from, to } --> 腾讯云 SCF
腾讯云 SCF -- 读取 BAIDU_APP_ID / BAIDU_SECRET、生成 sign --> 百度翻译 API
```

前端只保留公开的 `VITE_BAIDU_TRANSLATE_URL`。百度 `APP ID` 和 `SECRET` 仅存在腾讯云 SCF 环境变量中。

## 3. GitHub Actions 配置

在仓库 Settings → Secrets and variables → Actions 中配置：

```text
VITE_BAIDU_TRANSLATE_URL=https://你的函数.ap-guangzhou.tencentscf.com
VITE_SITE_STATS_URL=https://你的统计-worker.workers.dev/stats
```

删除历史遗留的 `VITE_BAIDU_APP_ID` 和 `VITE_BAIDU_SECRET`。部署工作流不再把它们传给 `npm run build`。

## 4. 验收清单

- 本地 `.env` 与 GitHub Secret 都只有公开的函数 URL，不含百度密钥。
- 页面可以完成中译英和英译中。
- Network 请求中没有 `appid`、`salt`、`sign`。
- 翻译函数的 SCF 环境变量包含 `BAIDU_APP_ID`、`BAIDU_SECRET`、`ALLOWED_ORIGINS`。
- 页脚统计使用独立的 `VITE_SITE_STATS_URL`，不再从翻译 URL 推导 `/stats`。
- 旧百度密钥已轮换并只保存在 SCF。

腾讯云 SCF 的创建、函数代码与排障说明见《腾讯云 SCF 百度翻译安全中转部署与排障》。
