# GitHub Pages 部署百度翻译失败处理记录

## 背景

项目本地开发环境可用，但部署到 GitHub Pages 后，翻译模块提示未配置或无法正常翻译。

---

## 现象

- 页面提示：请复制 `.env.example` 为 `.env` 并填写 `VITE_BAIDU_APP_ID` 与 `VITE_BAIDU_SECRET`
- 本地 `npm run dev` 能翻译，线上 `https://jsoncc.github.io/today-history/` 不能翻译

---

## 根因分析

### 1. GitHub Actions 构建未读取本地 `.env`

GitHub Pages 的构建在 CI 中执行，不会读取你电脑本地 `.env`。如果 `deploy.yml` 没有显式把变量传给 `npm run build`，则前端打包时 `VITE_BAIDU_APP_ID` 和 `VITE_BAIDU_SECRET` 都是空值。

### 2. GitHub Pages 是纯静态托管

本地开发能用 Vite 代理（`/baidu-fanyi`），但线上没有 Vite dev server。  
而百度翻译开放接口不支持浏览器直接跨域调用（CORS），所以线上前端不能直接请求百度地址，必须经过一个可访问的转发层。

### 3. 密钥管理风险

`VITE_*` 变量会被打包进前端，若把真实密钥放在示例文件或仓库中，会有泄露风险。

---

## 采取的修复方案

## A. 调整环境变量模板

保留 `.env.example` 作为模板，不写真实密钥，只保留占位：

- `VITE_BAIDU_APP_ID=`
- `VITE_BAIDU_SECRET=`
- `VITE_BAIDU_TRANSLATE_URL=`

说明：
- 本地使用真实值写在 `.env`
- 线上使用 GitHub Secrets

## B. CI 构建注入环境变量

在 `.github/workflows/deploy.yml` 的 Build 步骤中注入：

- `VITE_BAIDU_APP_ID: ${{ secrets.VITE_BAIDU_APP_ID }}`
- `VITE_BAIDU_SECRET: ${{ secrets.VITE_BAIDU_SECRET }}`
- `VITE_BAIDU_TRANSLATE_URL: ${{ secrets.VITE_BAIDU_TRANSLATE_URL }}`

这样 GitHub Actions 打包时就能读到变量。

## C. 增加 Worker 转发层（解决线上 CORS）

新增：

- `workers/baidu-proxy.js`
- `workers/wrangler.toml`

用途：浏览器请求 Worker，Worker 再 POST 转发到百度翻译接口 `https://fanyi-api.baidu.com/api/trans/vip/translate`，并返回允许跨域的响应头。

## D. 前端翻译请求策略

`App.vue` 逻辑改为：

- 开发环境：默认走 `/baidu-fanyi`（Vite 代理）
- 生产环境：优先使用 `VITE_BAIDU_TRANSLATE_URL`（Worker 地址）
- 若生产环境没配置 `VITE_BAIDU_TRANSLATE_URL`，界面给出明确提示

签名继续使用：

- `sign = MD5(appid + q + salt + secret)`

---

## Worker 部署实操（Windows）

在 `D:\projects\today-history\workers` 目录执行：

```bash
cd d:\projects\today-history\workers
npx wrangler login
npx wrangler deploy
```

部署成功后可得到：

`https://xxx.workers.dev`

将此地址配置到：

- 本地 `.env`：`VITE_BAIDU_TRANSLATE_URL=https://xxx.workers.dev`
- GitHub Secret：`VITE_BAIDU_TRANSLATE_URL`

---

## 登录 Wrangler 时遇到的问题与处理

### 报错

`Timed out waiting for authorization code, please try again.`

### 原因

Wrangler 等待 OAuth 回调（localhost）超时，常见于浏览器授权未完成、代理/VPN 干扰、终端环境异常。

### 处理办法

1. 用系统 PowerShell 重试 `npx wrangler login`
2. 临时关闭或调整代理/VPN
3. 若仍失败，改用 API Token 方式（`CLOUDFLARE_API_TOKEN`）部署

---

## 最终上线检查清单

- [ ] 本地 `.env` 已配置 `VITE_BAIDU_APP_ID` 与 `VITE_BAIDU_SECRET`
- [ ] Worker 已部署成功并拿到 `workers.dev` URL
- [ ] GitHub Secrets 已配置三项：
  - `VITE_BAIDU_APP_ID`
  - `VITE_BAIDU_SECRET`
  - `VITE_BAIDU_TRANSLATE_URL`
- [ ] 推送到 `main` 后 Actions 成功完成 Pages 部署
- [ ] 线上翻译功能可正常返回结果

---

## 经验结论

1. 本地可用不代表静态线上可用，尤其是涉及第三方 API 时。  
2. CI 构建环境必须显式注入变量，不能依赖本机 `.env`。  
3. `.env.example` 应保留模板并去敏感信息。  
4. 对不支持 CORS 的接口，静态站应使用 Worker/后端代理转发。
