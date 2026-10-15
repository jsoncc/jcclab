---
category: site-engineering
title: 腾讯云 SCF 百度翻译安全中转部署与排障
tags:
  - 百度翻译
  - 腾讯云
  - SCF
  - 安全
  - 排障
---

# 腾讯云 SCF 百度翻译安全中转部署与排障

> 本文记录 jcclab 的中英翻译最终架构：浏览器只提交文本，腾讯云 SCF 保存百度密钥并在服务端签名。不要把百度密钥写进 `VITE_*` 环境变量。

## 1. 为什么要迁移

百度翻译开放接口不支持浏览器直接跨域调用，静态站需要中转服务。旧方案虽然把请求经由腾讯云 SCF 转发，但仍由浏览器生成 `sign`，因此 `VITE_BAIDU_APP_ID` 与 `VITE_BAIDU_SECRET` 会被打进前端 JavaScript，任何访客都能提取。

安全架构应为：

```text
浏览器 -- POST { q, from, to } --> 腾讯云 SCF -- 服务端签名 --> 百度翻译 API
```

翻译使用腾讯云 SCF 的国内出口；PV/UV 统计仍独立使用 Cloudflare Worker 的 `/stats`，两者不再共用地址。

## 2. 创建或更新 Web 函数

1. 打开腾讯云云函数控制台：https://console.cloud.tencent.com/scf/list 。选择广州地域，在「函数列表」搜索 `baidu-fanyi-proxy` 并打开；找不到才新建。
2. 进入函数详情顶部的「函数 URL」标签，复制“公网访问”的 HTTPS 地址。这是翻译服务地址，域名中不能含 `.in.`（那是内网地址）。
3. 函数类型选择「Web 函数」，运行环境选择 Node.js 20，监听端口保持 `9000`。
4. 把仓库 `workers/tencent-scf/baidu-fanyi-proxy.js` 的完整内容粘贴到 SCF 的 `app.js`。
5. 若还没有函数 URL，则新建时选择：公网访问、开放授权、参数兼容开启；CORS 不必在控制台开启，函数代码会处理。

## 3. 设置 SCF 环境变量

在「函数配置 → 环境变量」设置以下值：

```text
BAIDU_APP_ID=你的百度翻译 App ID
BAIDU_SECRET=你的百度翻译密钥
ALLOWED_ORIGINS=https://jsoncc.github.io,http://localhost:3000
```

这些变量只保存在腾讯云运行环境中。不要在 `.env`、GitHub Actions Secrets 的 `VITE_*` 变量或前端代码中保存百度密钥。

函数会校验语言与文本长度、限制单实例每 IP 每分钟 20 次请求，并为百度上游请求设置 10 秒超时。若站点访问量显著增加，还应在腾讯云侧配置 WAF 或 API 防护规则；实例内限流不能替代全局防护。

## 4. 配置前端与部署

1. 将函数 URL 写入本地 `.env`：

```text
VITE_BAIDU_TRANSLATE_URL=https://你的函数.ap-guangzhou.tencentscf.com
```

2. 在 GitHub 仓库 Actions Secrets 中只保留或新增 `VITE_BAIDU_TRANSLATE_URL`。
3. 删除旧的 `VITE_BAIDU_APP_ID`、`VITE_BAIDU_SECRET` Secrets；它们不能参与前端构建。
4. 将 Cloudflare Worker 的统计地址单独写入 `VITE_SITE_STATS_URL`，例如 `https://你的-worker.workers.dev/stats`。
5. 触发 GitHub Pages 部署。

## 5. 验证与密钥轮换

部署后，打开翻译模块完成一次中译英和英译中。浏览器开发者工具的 Network 请求体应只有：

```text
q=...
from=auto
to=en 或 zh
```

请求中不应再出现 `appid`、`salt`、`sign` 或百度密钥。

旧密钥曾进入过前端构建产物，因此确认新链路可用后，应在百度翻译开放平台轮换密钥，并只更新 SCF 的 `BAIDU_SECRET`。旧密钥随后作废。

## 6. 常见排障

| 现象 | 检查项 |
| --- | --- |
| 浏览器提示未配置翻译服务 | 本地 `.env` 或 GitHub Secret 是否设置 `VITE_BAIDU_TRANSLATE_URL` |
| 浏览器返回 `origin_not_allowed` | `ALLOWED_ORIGINS` 是否包含实际站点域名，且没有尾部斜杠 |
| 返回 `server_not_configured` | SCF 的 `BAIDU_APP_ID`、`BAIDU_SECRET` 是否已保存并发布 |
| 返回 `upstream_timeout` 或 502 | 检查 SCF 出网、百度服务状态与函数日志 |
| 返回 `rate_limited` | 等待一分钟；如为正常高并发，改用腾讯云 WAF/API 防护提供全局限流 |

> 历史上 Cloudflare Worker 直接转发百度会因海外出口 IP 被风控并触发 58003，因此翻译保持使用腾讯云 SCF；Cloudflare Worker 现在只承担统计功能。
