# Chrome 局域网访问（Local Network Access）配置与疑难解答指南

本指南用于解决现代 Chrome/Edge 浏览器出于安全限制（如局域网访问限制及跨域/混合内容拦截），导致网页无法正常调起本地硬件设备或本地服务（如 `127.0.0.1` / 局域网 IP）的问题。

---

## 一、 原理与操作方案对比

浏览器的 **Local Network Access Checks** 功能旨在阻止外网网页私自扫描或调用用户的本地网络设备。针对该限制有两种解决方法：

* **全局禁用安全检查（不推荐）：** 在 `edge://flags` 或 `chrome://flags` 中将 `Local Network Access Checks` 设为 `Disabled`。该操作会导致全局生效，使所有外网网页均可无拦截地访问本地网络，存在安全风险。
* **按域名配置白名单（推荐）：** 保持浏览器全局策略为 **Default**，仅将信任的特定业务网址加入注册表白名单。

---

## 二、 推荐配置：通过 Windows 注册表配置域名白名单

保持浏览器 Flags 默认开启，利用企业组策略白名单精确放行指定域名。

### 1. 注册表配置步骤

1. 按 `Win + R` 键，输入 `regedit` 并回车，打开**注册表编辑器**。
2. 依次展开导航至以下路径：
`HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome`
*(若路径中缺失 `Google` 或 `Chrome` 文件夹，右键上一级选择 **新建 -> 项(Key)** 手动补齐)*。
3. 在 `Chrome` 项下 **新建 -> 项(Key)**，命名为：
`LocalNetworkAccessAllowedForUrls`
4. 点击进入该文件夹，在右侧空白处 **新建 -> 字符串值(String Value)**：
* **名称**：`1`（如需添加多个域名，依次递增使用 `2`, `3` 等）
* **数值数据**：`*://sub.domain.com/` *(推荐使用 `*://` 通配符匹配 HTTP 与 HTTPS)*



> **快捷 CMD 命令（管理员权限运行）：**
> ```cmd
> reg add "HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome\LocalNetworkAccessAllowedForUrls" /v 1 /t REG_SZ /d "*://sub.domain.com/" /f
> 
> ```
> 
> 

### 2. 生效与验证

1. 打开 Chrome，确保 `chrome://flags/#local-network-access-checks` 保持为 **Default**。
2. 地址栏输入并打开：`chrome://policy`
3. 点击 **重新加载策略**，确认列表中显示 `LocalNetworkAccessAllowedForUrls` 且状态为 **正常**。

---

## 三、 特殊情况处理：HTTP 域名依然无法访问本地设备

当配置完白名单后，若发现 `https://` 可以正常访问本地设备，但 `http://` 依然无法访问，原因在于 Chrome 的 **安全上下文（Secure Context）** 机制拦截了不安全协议（HTTP）调用敏感 API。

### 1. 临时解决办法（配置不安全来源信任）

可以通过注册表强制将指定的 HTTP 域名标记为“安全来源”：

1. 打开注册表，定位至：`HKEY_LOCAL_MACHINE\SOFTWARE\Policies\Google\Chrome`
2. 在 `Chrome` 项下 **新建 -> 项(Key)**，命名为：
`UnsafelyTreatInsecureOriginAsSecure`
3. 在右侧 **新建 -> 字符串值**：
* **名称**：`1`
* **数值数据**：`[http://sub.domain.com](http://sub.domain.com)`


4. 打开 `chrome://policy` 点击 **重新加载策略**。

> **关于策略状态显示“已弃用”的说明：**
> 在 `chrome://policy` 中该项会显示为 **已弃用（Deprecated）**。这是因为 Google 官方不鼓励使用 HTTP，故将该过渡接口标记为弃用警告，但当前浏览器内核仍然兼容并能正常执行其逻辑。

### 2. 根本解决办法（推进上线 HTTPS）

为网站（如 `sub.domain.com`）部署 SSL/TLS 证书并开启 HTTP 到 HTTPS 的自动跳转，**HTTP 自动重定向（HTTP to HTTPS Redirect）**：

* **证书只保护 HTTPS 传输**，`http://` 协议本身不会因为服务端装了证书而自动变安全。
* 上线 HTTPS 后，业务统一通过 `https://` 访问，网站天然具备“安全上下文”身份。这样一来，即使你在浏览器里输入 [http://sub.domain.com](http://sub.domain.com)，服务器也会自动把你弹到 [https://sub.domain.com](https://sub.domain.com) 上。
* 此后**仅需保留** `LocalNetworkAccessAllowedForUrls` 策略即可，无须依赖已弃用的策略。

这里是为您补充整理的**补充篇：HTTP 与 HTTPS 访问本地设备的原理与关系**，保持精炼无废话，方便直接附在上一份文档后面：

---

# 附录：HTTP 与 HTTPS 访问本地设备原理分析

## 一、 HTTP 与 HTTPS 的本质区别

* **HTTP（不安全）：** 数据明文传输，极易被拦截或篡改。数据在传输过程中是明文的。网络上的任何人（比如同局域网的黑客、中间路由器）都可以拦截甚至篡改传输的内容。Chrome 将其判定为**非安全上下文（Non-Secure Context）**。
* **HTTPS（安全）：** 数据加密传输且通过证书验证身份。数据在传输过程中是经过加密的，并且通过数字证书验证了网站的身份。Chrome 将其判定为**安全上下文（Secure Context）**。

---

## 二、 为什么配置白名单后 HTTPS 能访问，而 HTTP 无法访问？

网页调起本地设备必须**同时满足**以下两个条件：

| 协议类型 | 条件一：安全上下文（身份凭证） | 条件二：局域网白名单（权限授权） | 最终结果 |
| --- | --- | --- | --- |
| **`[https://sub.domain.com/](https://sub.domain.com/)`** | **通过**（属于 HTTPS 加密传输） | **通过**（已配置策略白名单） | **成功访问本地设备** |
| **`[http://sub.domain.com/](http://sub.domain.com/)`** | **未通过**（属于明文传输，底层被封杀） | **通过**（已配置策略白名单） | **直接拦截，无法访问** |

*注：HTTP 网页即使通过了白名单授权，也会因为缺少“安全上下文”身份被 Chrome 底层机制一刀切禁用了高级 API。*

---

## 三、 这与“上线 HTTPS”的关系

为避免使用即将废弃的 `UnsafelyTreatInsecureOriginAsSecure` 策略，根治问题的最好方式就是系统**上线 HTTPS**：

* **核心含义：** 由服务端部署 SSL 证书，并配置 **HTTP 自动强制跳转至 HTTPS**。
* **效果：** 证书本身不会让 HTTP 变安全，但跳转后所有的本地设备调用都会在 `https://` 下运行，网站天然获得“安全上下文”资格，仅需保留 `LocalNetworkAccessAllowedForUrls` 策略即可永久稳定运行。