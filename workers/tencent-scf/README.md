# 腾讯云 SCF 安全翻译函数

该函数替代旧的“浏览器签名、SCF 原样转发”方案：百度密钥只存在于腾讯云 SCF 环境变量，浏览器只发送待翻译文本。

## 部署

1. 打开腾讯云云函数控制台：https://console.cloud.tencent.com/scf/list 。选择广州地域，在「函数列表」搜索并打开现有 `baidu-fanyi-proxy`；找不到才新建 Web 函数。
2. 在函数详情顶部打开「函数 URL」标签，复制“公网访问”的 HTTPS 地址（域名不含 `.in.`，不要复制内网地址）。这就是 `VITE_BAIDU_TRANSLATE_URL` 的值。
3. 运行时选择 Node.js 20，监听端口为 `9000`。
4. 将 [baidu-fanyi-proxy.js](./baidu-fanyi-proxy.js) 全文粘贴至函数的 `app.js`。
5. 在“函数配置 → 环境变量”设置：
   - `BAIDU_APP_ID`
   - `BAIDU_SECRET`
   - `ALLOWED_ORIGINS=https://jsoncc.github.io,http://localhost:3000`
6. 若尚未创建函数 URL，则在「函数 URL」中选择“公网访问、开放授权”；函数代码自行处理 CORS。
7. 将第 2 步复制的 URL 写入本地 `.env` 和 GitHub Actions Secret `VITE_BAIDU_TRANSLATE_URL`。
8. 在 GitHub Actions Secret 删除 `VITE_BAIDU_APP_ID` 与 `VITE_BAIDU_SECRET`；它们绝不能再用于前端构建。
9. 重新部署 Pages，确认浏览器翻译请求中不含 `appid`、`salt` 或 `sign`。
10. 在百度翻译开放平台轮换旧密钥，只更新 SCF 中的 `BAIDU_SECRET`。

函数提供每 IP 每分钟 20 次的实例内基础限流与 10 秒上游超时。SCF 为弹性实例，若要防御大规模滥用，还应在腾讯云侧配置 WAF 或 API 防护策略。
