

> **一句话**：百度翻译接口拒绝原 Cloudflare Worker 中转（海外机房 IP 触发风控，报 58003）；把翻译转发代理迁到腾讯云 SCF（国内出口）后恢复正常，PV/UV 统计继续留在原 Worker，互不影响。

---

## 1. 背景：翻译模块的架构

jcclab 是 GitHub Pages 上的静态站，前端代码里集成了百度翻译（中英互译）。由于百度翻译 API 有两个硬性限制，翻译请求**必须经过一个中转代理**：

1. **百度接口不带 CORS 头** —— 浏览器跨域直连会被拦截
2. **appid/secret 打包在前端** —— `VITE_BAIDU_APP_ID` / `VITE_BAIDU_SECRET` 由 GitHub Actions 构建时注入，任何人打开站点源码都能提取，密钥不可能保密

原架构：

```
浏览器(GitHub Pages) --POST--> Cloudflare Worker(转发) --> fanyi-api.baidu.com
```

Cloudflare Worker（`jcclab-baidu-proxy.896415482.workers.dev`）身兼两职：
- **翻译转发**：POST 原样转发给百度
- **站点统计**：`GET /stats` 提供 PV/UV（KV 存储 + Cookie 访客标记）

配置链路：GitHub Secrets（`VITE_BAIDU_APP_ID` / `VITE_BAIDU_SECRET` / `VITE_BAIDU_TRANSLATE_URL`）→ Actions 构建时注入 → 打进 dist 产物。

本地开发则用 Vite 代理 `/baidu-fanyi` 直连百度。

---

## 2. 故障现象

线上站点「翻译」模块使用时提示：

```
service invalid（58003）
```

---

## 3. 排查过程

### 3.1 先搞清楚 58003 是什么

百度翻译开放平台错误码：**58003 = 未开通服务或服务已失效**。表面看像账号/密钥问题，但实际排查下来根本不是。

### 3.2 验证凭据是否有效（关键一步）

从线上构建产物（dist 的 JS 文件）里提取出内联的 appid 和 secret，用同一套凭据 + 标准 MD5 签名**直连百度官方接口**：

```
POST https://fanyi-api.baidu.com/api/trans/vip/translate
q=今天天气不错 & from=auto & to=en & appid=... & salt=... & sign=MD5(appid+q+salt+secret)
```

结果：**返回 200，正常译文 `it's a nice day today`**。

结论：appid、secret、签名算法全对，翻译服务确实开通着。**问题不在凭据。**

### 3.3 怀疑目标转向"出口 IP"

同样的凭据、同样的签名：
- 从家里网络直连百度 → 成功
- 从浏览器经 Cloudflare Worker → 58003

唯一变量是**出口 IP**：百度看到的是 Cloudflare 海外数据中心 IP，对免费接口的这类来源有风控，直接拒绝。之前"能用"只是因为当时出口 IP 段还没被风控或恰好没触发。

排查中还发现：`*.workers.dev` 域名在国内网络被**间歇性 SNI 阻断**（本机 WSL 直接连不通、连接超时），但用户浏览器能通（站点统计一直正常就是证据）——所以 Worker 本身没挂，是百度拒绝，不是链路不通。

用阿里 DNS / DNSPod 的 DoH 接口交叉查询 Worker 域名解析状态，进一步确认了域名可达性问题与风控无关。

### 3.4 修复方案对比

| 方案 | 做法 | 评价 |
|------|------|------|
| 1. 中转换到国内云函数 | 腾讯云 SCF / 阿里云 FC 部署同样转发逻辑，出口变国内机房 IP | ✅ 推荐：免费额度够用、无需服务器/域名/备案 |
| 2. 国内 VPS + nginx 反代 | 自备服务器，几行配置 | 有 VPS 才划算 |
| 3. 换翻译服务商 | 换支持 CORS 的免费接口 | 质量/稳定性难保证 |

选择**方案 1**，腾讯云 SCF（个人已实名认证）。两个云对比后选腾讯云，原因是 **Web 函数 = HTTP 直通模型**，代码和原 Worker 几乎一致，改造量最小；阿里云 FC 的 2.0/3.0 版本演进让教程新旧混杂，容易踩坑。

---

## 4. 实施过程（具体操作 + 踩坑记录）

### 4.1 进入腾讯云并完成个人认证

1. 浏览器打开腾讯云官网 https://cloud.tencent.com → 右上角「登录」（微信/QQ/邮箱任一即可）
2. 新账号首次使用会引导「**个人实名认证**」：按提示微信扫码 + 填写姓名/身份证号，几分钟完成（不认证无法创建云函数）
3. 打开云函数控制台：控制台顶部搜索框搜「**云函数**」，或直接访问 https://console.cloud.tencent.com/scf/list
4. 首页出现的「云函数新客试用套餐」（0 元、3 个月、最高 115 元资源包）可领可不领——**真正让服务免费的是个人用户每月固定的免费额度**（几十万次调用级别），自动生效、永久有效；注意别点任何「购买资源包」按钮

### 4.2 新建 Web 函数

操作步骤：

1. 云函数控制台 → 「函数列表」→ 点「**新建函数**」
2. 创建方式：选「**从头开始**」
3. 函数类型：选「**Web 函数**」
4. 地域：**广州**（默认即可；本场景是纯转发，地域不影响体验，见第 5 节）
5. 运行环境：选「**Node.js 20.19**」（要求 ≥18，Node 18 起自带全局 fetch，旧版本没有）
6. 函数名：`baidu-fanyi-proxy`
7. 「函数代码」区域：代码来源选「**Cloud Studio**」（在线编辑）
8. 把默认的 `app.js` 内容**全部删除**，粘贴下面的完整代码（文件第一行必须是 `'use strict'`，不能多任何东西）

```js
'use strict'
const http = require('http')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS)
    res.end()
    return
  }
  if (req.method !== 'POST') {
    res.writeHead(405, CORS)
    res.end('POST only')
    return
  }

  let body = ''
  req.on('data', (chunk) => { body += chunk })
  req.on('end', async () => {
    try {
      const upstream = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body
      })
      const text = await upstream.text()
      res.writeHead(upstream.status, {
        ...CORS,
        'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8'
      })
      res.end(text)
    } catch (err) {
      res.writeHead(502, CORS)
      res.end(String(err && err.message || err))
    }
  })
}).listen(9000, () => console.log('listen 9000'))
```

9. 确认「**监听端口**」为 `9000`（默认值，别改）
10. 勾选《腾讯云函数网络服务协议》→ 点「**完成**」创建

> 【坑 1】Web 函数和事件函数的代码模型不同：**Web 函数 = 自己起 HTTP 服务**（`http.createServer` 监听 9000，平台把请求转发进来）；事件函数 = 导出 `exports.main_handler(event)`。最初按事件函数格式写，运行会失败，已更正为 HTTP 服务版。

### 4.3 配置函数 URL（对外访问地址）

操作步骤：

1. 进入函数详情页 → 顶部标签点「**函数 URL**」
2. 点「**新建函数 URL**」
3. 表单填写：
   - **触发别名**：默认流量
   - **访问方式**：只选「**公网访问**」（内网访问用不到，别选）
   - **CORS**：不启用（函数代码自己返回 CORS 头，足够）
   - **授权类型**：「**开放**」（必须选开放；选 CAM 鉴权的话网页调用会 403）
   - **参数兼容**：启用（默认）
4. 提交后复制「公网访问」下的 **HTTPS 地址**（形如 `https://1471055279-xxxx.ap-guangzhou.tencentscf.com`）

> 【坑 2】新版控制台 **API 网关触发器已停服**（2024-07-01 起无法新建，2025-06-30 停止服务），公开 HTTP 入口只能用「函数 URL」，别去「触发管理」里找 API 网关。
>
> 【坑 3】函数 URL 分公网/内网访问：**内网地址域名带 `.in.` 段**（如 `xxx.in.ap-guangzhou.tencentscf.com`），只在腾讯云内部网络可解析，公网 DNS 查不到 → curl 报 `Could not resolve host`。必须用**公网访问**的地址（不带 `.in.`）。
>
> 【坑 4】公网访问启用后 **DNS 发布有延迟**：公共 DNS 查询呈 NODATA（域名存在但无 A 记录）。等了约 30 分钟仍无效后，**删除函数 URL 重新创建**，重建后立即生效（重建会重新触发 DNS 发布）。
>
> 【坑 5】函数详情页下方的「测试」工具对函数 URL **不支持**（提示"函数URL暂不支持测试功能"，测试按钮是灰的）——跳过它，用 4.4 的 curl 验证。

### 4.4 curl 验证中转（函数是否真的通了）

1. 在你电脑打开终端（PowerShell 或 Git Bash）
2. 执行下面命令（把 `<函数URL>` 换成 4.3 复制的公网地址；命令里的签名已预计算，salt 固定为 1）：

```bash
curl -X POST "https://<函数URL>" \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  --data-urlencode "q=今天天气不错" --data-urlencode "from=auto" --data-urlencode "to=en" \
  --data-urlencode "appid=20240612002075248" --data-urlencode "salt=1" \
  --data-urlencode "sign=b919b40a8f82c05b5cbfd6fbb30a0f60"
```

3. 返回 `{"from":"zh","to":"en","trans_result":[{"src":"今天天气不错","dst":"it's a nice day today"}]}` → 函数全通（代码逻辑、出网、百度接受国内 IP 都确认了）

> 浏览器里的签名是每次实时算的（salt 用 `Date.now()`），验证命令里是固定 salt=1 的演示签名，两者等价。

### 4.5 切换线上站点

1. GitHub 仓库 `jsoncc/jcclab` → **Settings** → **Secrets and variables** → **Actions**
2. 找到 `VITE_BAIDU_TRANSLATE_URL` → 点 **Edit** → 值改为 4.3 的函数 URL（去掉末尾斜杠）→ 保存
3. 其余 3 个 Secret（`VITE_BAIDU_APP_ID` / `VITE_BAIDU_SECRET` / `VITE_SITE_STATS_URL`）**不要动**
4. GitHub → **Actions** → **Deploy to GitHub Pages** → **Run workflow**，等约 2~3 分钟跑完变绿
5. 打开 https://jsoncc.github.io/jcclab/#/ → 点「**翻译**」模块 → 输入中文或英文 → 点「**翻译**」→ 正常出译文 ✅

---

## 5. 最终架构与成本

| 功能 | 走哪 | 备注 |
|------|------|------|
| 翻译 | 腾讯云 SCF（广州地域，公网函数 URL） | 免费额度内（个人用户每月几十万次调用级别），实际 0 元 |
| 统计 PV/UV | Cloudflare Worker + KV（原样保留） | 不动，`VITE_SITE_STATS_URL` 未改 |

新架构：

```
浏览器(GitHub Pages) --POST--> 腾讯云 SCF(广州, 国内出口) --> fanyi-api.baidu.com ✅
                        └──GET /stats--> Cloudflare Worker + KV（统计，不变）
```

函数在广州地域但用户不在南方：**无影响**。转发是无状态操作，跨地域只多几十毫秒延迟，而百度翻译本身处理就要 200~500ms，用户无感知；函数不访问任何地域性私有资源，地域只影响网络路径长短。不建议为此换地域（重建函数 + 换 URL + 重新部署，收益为零）。

---

## 6. 经验总结

1. **百度免费翻译接口对海外机房 IP 有风控**：58003 表象是"服务未开通/失效"，但凭据直连验证通过时，先怀疑出口 IP，别急着改密钥
2. **VITE_ 变量打包在前端 = 凭据公开**：appid/secret 任何人可从站点 JS 提取，只能靠"中转 + 风控"兜底，没有保密性可言；介意的话应定期更换密钥
3. **云函数选型**：Web 函数 = 自己起 HTTP 服务（监听 9000）；事件函数 = 导出 `main_handler`。两者代码模型完全不同，别混
4. **新控制台 API 网关已停服**：公开 HTTP 入口走「函数 URL」，创建时务必选**公网访问**（内网地址 `.in.` 域名公网解析不了）
5. **函数 URL 的 DNS 发布有延迟**：启用后 NODATA（域名存在无记录）是正常状态；超过约 30 分钟就删除重建，比干等快
6. **控制台测试工具对函数 URL 不可用**：用 curl + 预计算签名验证，绕过 UI 限制
7. **排障方法论**：先验证凭据（直连官方接口），再怀疑路径（出口 IP），最后用公共 DNS DoH 交叉确认域名状态——每一步都要有实证

---

## 附录：常用验证命令

```bash
# 1. 验证凭据是否有效（直连百度，绕过中转）
curl -X POST "https://fanyi-api.baidu.com/api/trans/vip/translate" \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  --data-urlencode "q=今天天气不错" --data-urlencode "from=auto" --data-urlencode "to=en" \
  --data-urlencode "appid=20240612002075248" --data-urlencode "salt=1" \
  --data-urlencode "sign=b919b40a8f82c05b5cbfd6fbb30a0f60"

# 2. 验证中转函数（换成自己的函数 URL）
curl -X POST "https://<函数URL>" \
  -H "Content-Type: application/x-www-form-urlencoded;charset=UTF-8" \
  --data-urlencode "q=今天天气不错" --data-urlencode "from=auto" --data-urlencode "to=en" \
  --data-urlencode "appid=20240612002075248" --data-urlencode "salt=1" \
  --data-urlencode "sign=b919b40a8f82c05b5cbfd6fbb30a0f60"

# 3. 查域名解析状态（nslookup 或公共 DoH）
nslookup <域名>
# DoH: https://dns.alidns.com/resolve?name=<域名>&type=A
```

> 说明：本实录中出现的 appid（20240612002075248）已随前端打包公开（见 6.2），任何人从站点 JS 都能提取；secret 未写入本文档。如需更换请在百度翻译开放平台重新生成，并在 GitHub Secrets 同步更新。
