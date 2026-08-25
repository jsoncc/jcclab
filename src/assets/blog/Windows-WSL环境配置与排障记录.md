---
title: Windows/WSL 环境配置与排障全记录
tags:
  - Windows
  - WSL
  - 环境配置
  - 排障
---

# Windows/WSL 环境配置与排障全记录

> 会话日期：2026-08-14 ｜ 环境：Windows 10 22H2 (19045.3803) + WSL 2.7.11 (Ubuntu) + Hermes Agent (CLI)
> 会话 ID：20260814_114835_56ede6（184 条消息，18 条用户提问）
> 主题：Windows Terminal 安装、右键菜单、看图模型配置、会话管理、技能合并、WSLg 弹窗排障

---

## 0. 环境概览

| 项目 | 值 |
|---|---|
| 系统 | Windows 10 22H2（10.0.19045.3803），用户 JsonCC（DESKTOP-6GD8VR1） |
| WSL | 2.7.11.0（Ubuntu），systemd 已启用，wsl --cd 可用 |
| Windows Terminal | 1.24.11911.0（手动旁加载安装，签名 Microsoft Corporation） |
| 主模型 | deepseek-v4-flash（provider: opencode-go，api_mode: chat_completions） |
| 视觉辅助模型 | kimi-k3（auxiliary.vision，实测真正识图） |
| 辅助模型 | title_generation / compression 均为 opencode-go/deepseek-v4-flash |
| 网络特征 | GitHub 主站/下载服务器直连不通；api.github.com 通（200）；加速代理 ghfast.top / gh-proxy.com / ghproxy.net 可用；mirror.ghproxy.com / ghproxy.cc 已失效 |
| 系统缺口 | 无 winget；rdclientax.dll 三处全缺（Win10 不带此组件） |

---

## 1. 会话背景与时间线

### 1.1 开场（寒暄测试）
- 「回复OK两个字」→「OK」：验证 CLI 可用（本会话开头又测了一遍）
- 「你是谁？」→ Hermes Agent（Nous Research 出品）
- 「你用的什么模型」→ deepseek-v4-flash，provider opencode-go，平台 CLI

### 1.2 完整时间线（关键节点）
| 时间 | 事件 |
|---|---|
| 11:47:44 | 第一次启动 hermes，「回复OK两个字」→「OK」（会话 1，仅 2 条消息） |
| 11:48:35 | 第二次启动 hermes（新会话 2 开始），又测了一遍「回复OK两个字」 |
| 14:29:56 | 正文开始：「你是谁？」「你用的什么模型」 |
| 14:36~14:45 | Windows Terminal 排查与安装（代理下载、依赖、旁加载策略） |
| 14:45+ | 右键菜单注册、路径转换脚本、wt -d 排障 |
| 15:xx | 下拉菜单清理（隐藏 Azure + 重复 Ubuntu） |
| 17:22~17:37 | 看图模型配置（kimi-k3 定稿）、会话重命名、技能合并 |
| 23:03~23:06 | RDP 弹窗监视器抓现行（msrdc 落网） |
| 23:10+ | .wslconfig 修复 WSLg 弹窗 |

---

## 2. Windows Terminal 安装全流程（无 winget 场景）

### 2.1 排查结论
- `wt.exe` 不在 PATH（`where wt` 无结果），商店应用列表无记录 → 未安装
- `winget` 不存在（Win10 老版本常见）→ 走手动旁加载路线
- VCLibs 已具备（14.0.33519.0 等多版本），只需补 Microsoft.UI.Xaml 2.8

### 2.2 尝试过的下载路线（失败的先排除）
| 路线 | 结果 |
|---|---|
| GitHub 直连 | 主站/下载服务器超时（000），只有 api.github.com 通 |
| store.rg-adguard.net 商店链接解析 | 有 Cloudflare 人机验证（"Just a moment..."），curl 过不去 |
| 浏览器过验证 | 浏览器 harness 无法自动启动（chrome-not-running） |
| 微软商店 CDN 直链 | tlu.dl.delivery / dl.delivery.mp.microsoft.com 均不可达（000） |
| **GitHub 加速代理** | ✅ ghfast.top 等可用，最终方案 |

### 2.3 下载与签名验证（必做步骤）
1. `api.github.com` 查最新版与资产：tag v1.24.11911.0，msixbundle 22,304,127 字节
2. 代理下载：`curl -L -o pkg.msixbundle "https://ghfast.top/https://github.com/microsoft/terminal/releases/download/v1.24.11911.0/Microsoft.WindowsTerminal_1.24.11911.0_8wekyb3d8bbwe.msixbundle"`
3. 核对字节数与 API size 字段一致（防代理返回损坏内容）
4. Authenticode 签名验证：
```powershell
$sig = Get-AuthenticodeSignature 'D:\wt_install\Microsoft.WindowsTerminal.msixbundle'
$sig.Status                                   # 必须 Valid
$sig.SignerCertificate.Subject                # 必须 CN=Microsoft Corporation
```

### 2.4 依赖链与错误码
| 错误 | 含义 | 解决 |
|---|---|---|
| 0x80073CF3 | 缺少框架依赖 | 先装 Microsoft.UI.Xaml.2.8.x64.appx（microsoft-ui-xaml 仓库老 tag v2.8.6 有分架构资产；**v2.8.7 发布页无资产**是坑） |
| 0x80073D04 系列（找不到适用的应用许可证） | 旁加载策略未开 | 提权写注册表 `AllowAllTrustedApps=1`（见下） |

注意：`Add-AppxPackage` 在策略未开时**安装能成功**，是**启动时才报许可证错**——策略管的是"运行"不是"安装"。

```powershell
# 提权脚本模式（会弹 UAC，需提前告知用户点"是"；-Wait 阻塞到用户应答）
Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','D:\wt_install\fix.ps1'
# fix.ps1 内容：
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" /v AllowAllTrustedApps /t REG_DWORD /d 1 /f
# 验证：Get-ItemProperty ...AppModelUnlock → AllowAllTrustedApps=1
```

### 2.5 启动验证与两个小坑
```powershell
Get-AppxPackage -Name Microsoft.WindowsTerminal | Select Name, Version, InstallLocation   # 确认注册
Start-Process 'wt.exe'; Start-Sleep 5; Get-Process -Name 'WindowsTerminal'                # 确认运行
```
- `cmd /c start wt.exe` 对应用执行别名（WindowsApps 里的 wt.exe）会报「系统无法执行指定的程序」→ 用 `Start-Process`
- 启动失败报「找不到适用的应用许可证」就是 2.4 的策略问题

### 2.6 进程/窗口验证方法论（重要教训）
- `[bool](Get-Process -Name X)` 会被**历史残留进程污染**，产生"验证成功"的假象（本次实际烧了约 15 分钟）
- 正确做法：**快照 PID + StartTime → 执行 → 等待 5-8 秒 → 再快照 → 按 PID/StartTime 差集**判断是否真有新进程：
```powershell
Get-Process -Name wsl | Select Id, StartTime | Sort StartTime   # 前后对比
```

---

## 3. 在指定文件夹启动 Windows Terminal

### 3.1 五种启动方式
1. **开始菜单**：搜索"终端"/"Windows Terminal"
2. **右键菜单**（推荐）：文件夹上/空白处右键 →「在 Ubuntu 中打开」（自动转 WSL 路径）或「在 Windows Terminal 中打开」（默认配置档）
3. **资源管理器地址栏**：输入 `wt` 回车，即在该文件夹打开
4. **Win+R**：`wt -d "D:\你的文件夹"`
5. **任意终端里**：`wt -d 路径` 新开标签页

### 3.2 关键坑：wt -d 传 UNC 路径在 Win10 上不可用
- `wt -d "\\wsl.localhost\Ubuntu\..."` 报错 **0x8007010B**（目录名无效，错误 2147942667）
- 混合斜杠（`\\wsl.localhost\Ubuntu/mnt/d/...`）必挂；全反斜杠实测也不出进程（三组测试 A/B/C 全部无新 WSL 进程）
- **正确方案**：改用 `wsl --cd`（先验证支持：`wsl.exe --cd /tmp pwd` 输出 /tmp）：
```powershell
# 在 D:\farben\projects 右键打开 Ubuntu 终端到 /mnt/d/farben/projects
wt.exe -p Ubuntu wsl.exe -d Ubuntu --cd "/mnt/d/farben/projects"   # 路径加引号防空格截断
```

### 3.3 右键菜单注册（HKCU，无需管理员）
- 键位（4 个）：`HKCU\Software\Classes\Directory\shell\OpenUbuntuHere`、`Directory\Background\shell\OpenUbuntuHere`、`OpenTerminalHere`（两个变体）
- 「在 Ubuntu 中打开」命令：`powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\JsonCC\wt_open_here.ps1" "%V"`
- 「在 Windows Terminal 中打开」命令：`wt.exe -d "%V"`
- 脚本路径转换三分支：`D:\x` → `/mnt/d/x`；`\\wsl.localhost\Ubuntu\home\x` → `/home/x`；`\\wsl$\Ubuntu\...` 同上；无法识别 → `/home/jsoncc`
- 删除方法：删对应注册表键

### 3.4 编码教训（GBK vs UTF-8，最大时间黑洞）
- Win10 PowerShell 5.1 控制台输出是 GBK(cp936)；管道 `iconv -f GBK -t UTF-8` 脆弱（遇非法字节整段丢失，且可能被 grep 判为二进制杀掉）
- **可靠模式**：PowerShell 用 `Out-File -Encoding UTF8` 写文件到 /mnt/ 下，再从 WSL 读文件
- PS 5.1 读**无 BOM 的 .ps1 按 ANSI(GBK)** 解析 → 中文全变乱码（右键菜单中文标签就是这么坏的）
- **防乱码方案**：脚本保持纯 ASCII；中文负载用 `-EncodedCommand` 传 UTF-16LE base64（Python：`base64.b64encode(ps.encode('utf-16-le'))`）——右键菜单中文标签最终用此法修复
- `Out-File -Encoding UTF8` 会带 BOM，无害

---

## 4. 下拉菜单清理与配置档

### 4.1 菜单原始结构（5 项配置档 + 3 项系统项）
Windows PowerShell → 命令提示符 → Azure Cloud Shell → Ubuntu → Ubuntu →（分隔线）→ 设置 / 命令面板 / 关于

### 4.2 为什么有两个 Ubuntu
- 商店版 Ubuntu 应用注册一个配置档（source: CanonicalGroupLimited.Ubuntu_79rhkp1fndgsc，GUID {51855cb2-...}）
- WT 的 WSL 集成自动生成一个（source: Microsoft.WSL，GUID {72261c48-...}）
- 两者指向**同一个发行版**（内部都是 wsl -d Ubuntu），纯重复，Win10 上常见

### 4.3 settings.json 关键信息
- 位置：`%LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json`
- **默认配置档**：Windows PowerShell（GUID {61c54bbd-...}，commandline powershell.exe）——所以之前 wt -d 失败报错里出现 powershell.exe
- 清理动作：Azure Cloud Shell 与商店版 Ubuntu 设 `"hidden": true`（WT 热加载即生效，无需重启）
- 隐藏后菜单剩：Windows PowerShell、命令提示符、Ubuntu（WSL 集成版）+ 底部系统项

### 4.4 默认配置档 vs 右键（等价性说明）
- 右键「在 Ubuntu 中打开」= 直接以 Ubuntu 配置档 + 指定目录打开，**效果优于默认配置档**
- 默认配置档只影响**不带参数的启动**（Win+R 输 wt、地址栏输 wt、开始菜单、Ctrl+Shift+T）
- 结论：保持 PowerShell 为默认完全没问题，无需改动

---

## 5. 看图（图片识别）能力配置

### 5.1 根因
- 主模型 deepseek-v4-flash 是**纯文本模型**，API 直接拒绝图片（`unknown variant image_url, expected text`）
- Hermes 的 vision_analyze 会降级到"视觉辅助模型"，但当时 auxiliary 全配成同一个纯文本模型 → 降级也失败

### 5.2 候选模型实测记录（在 opencode-go 订阅内逐个验证）
| 候选模型 | 结果 |
|---|---|
| mimo-v2-omni | 已弃用（404，提示迁移到 xiaomi/mimo-v2.5） |
| mimo-v2.5-pro | 不支持图像输入（"No endpoints found that support image input"） |
| glm-5.2 | 请求通了但不看图（返回通用话术并明说无多模态能力，疑似静默忽略图像） |
| **kimi-k3** | ✅ 真正识图：准确读出截图中主机名 jsoncc@DESKTOP-6GD8VR1、重复 Ubuntu 条目、菜单底部系统项等像素级细节 |

### 5.3 配置与消耗机制
```bash
hermes config set auxiliary.vision.provider opencode-go
hermes config set auxiliary.vision.model kimi-k3
```
- 视觉模型是**固定配置**，不会自动查找/切换；失效时报错需手动换
- **发图消耗**：图片折算成 token 计入 opencode-go 订阅（截图一般几百~两千 token）；图片像素**不进入主模型上下文**，只有文字描述返回主模型（很小）
- 图片落盘 `~/.hermes/images/` 是本地操作，**不产生 API 消耗**（"不花钱"指落盘本身）
- 使用方式：把图片路径给 Hermes → 自动走 vision_analyze → kimi-k3

### 5.4 上下文上限（1M）机制
- 状态栏 `99.9K/1M`：已用 99.9K token / 上限 1M，进度条 10% 与之对应
- **到 1M 后对话不会断**：Hermes 自动压缩历史（把早期消息摘要化，细节简化；压缩用 auxiliary.compression 模型）
- 完整原始记录始终存在本地 state.db，不因压缩丢失
- 当前会话用量约 10%，远未到限

---

## 6. 会话管理

### 6.1 为什么会有两个会话（数据实证）
- 会话按**启动次数**划分：每次运行 `hermes` 命令都新建会话，与所在目录**无关**（目录只是 workspace 属性）
- 时间戳证据：11:47:44 会话 1（「回复OK两个字」→「OK」，2 条消息）；11:48:35 会话 2 开始（又测了一遍「回复OK两个字」，然后 14:29 才进入正文）——两次启动 hermes，用户没有主动"新增会话"却产生了两个
- 两会话内容**不一样**：会话 1 只有两句测试；会话 2 才是完整正文（184 条）

### 6.2 管理命令
```bash
hermes sessions list                    # 查看（含标题、workspace、最后活跃、ID）
hermes sessions rename <id> <新标题>     # 重命名（标题冲突自动加 #2 后缀）
hermes sessions delete <id>             # 删除（本会话用 --yes 跳确认）
hermes --continue                       # 接续最近会话
hermes --resume <id>                    # 接续指定会话
```
- 会话标题默认取自**第一条用户消息**（所以状态栏一直显示「回复OK两个字」），改标题即可，**不会丢历史**
- 本会话改名：`Windows Terminal 安装与 WSL 环境配置`；删除了「OK 测试」（用户确认后 `--yes` 删除）

---

## 7. 技能合并（策展器自动创建的 3 个重叠技能）

- Hermes 自我改进系统会把复杂会话自动沉淀为技能（界面通知：`Self-improvement review: Skill '...' created`）
- 本次生成了 3 个高度重叠的技能：windows-wsl-admin、windows-msix-sideload、windows-wsl-administration
- 合并方案：保留 **windows-wsl-admin** 为主技能；把另外两个的独有参考文件（win10-sideload-commands.md、store-app-sideload-win10.md）复制进主技能 references/；更新 SKILL.md 引用清单；`skill_manage(action=delete, absorbed_into=windows-wsl-admin)` 删除两个重复项
- 合并后：1 个技能 + 5 个参考文件（github-proxy-download / msix-sideload-recipe / wt-folder-launch / win10-sideload-commands / store-app-sideload-win10），内容零丢失

---

## 8. RDP 弹窗排障（最大谜题，已破案）

### 8.1 现象
每次右键「在 Ubuntu 中打开」成功进入终端后，弹出两个错误：
- 「远程桌面：无法加载远程桌面服务 ActiveX 控件。请确保 rdclientax.dll 在路径中」
- 「RemoteApp：计算机无法连接到远程计算机。请尝试重新连接…」

### 8.2 排查过程（排除法，全部干净）
- rdclientax.dll 在 System32 / SysWOW64 / WinSxS 三处全不存在
- 无 .rdp 文件、无 RemoteApp 工作区（HKCU/HKLM 均无）、无最近连接记录
- 计划任务无 mstsc/rdp 相关；Run 键只有 SecurityHealth + RtkAudUService；启动文件夹只有 desktop.ini
- TermService 停止（正常，本机非 RDP 服务器）；无第三方远程软件（Citrix/ToDesk/向日葵等均未装）
- 近 3 天 Application/System 日志无 RDP 相关事件；复现后 8 秒内无 mstsc 进程

### 8.3 破案关键：后台监视器抓现行
- 写监视脚本：每 5 秒记录新进程（StartTime 8 秒内）+ 带"远程/Remote"关键词的窗口标题，跑 3 分钟
- 用户复现右键操作 → 日志出现 **msrdc** 进程两次（23:04:54、23:05:17）
- msrdc 启动参数（铁证）：
```
msrdc.exe /wslg /silent /v:A6E06455-C018-41A1-A4CF-6A3692A02CF7 /hvsocketserviceid:... /plugin:WSLDVC_PACKAGE /wslgsharedmemorypath:WSL\...\wslg "C:\Program Files\WSL\wslg.rdp"
```
- 父进程：wslhost.exe → **WSLg（WSL 图形子系统）在启动**

### 8.4 根因
- WSL 2.7.11（当天 10:11 刚更新）用捆绑的远程桌面客户端 msrdc.exe 渲染 Linux GUI
- Win10 不提供 rdclientax.dll（Win11 系组件）→ 每次 WSL 启动，WSLg 拉起的 msrdc 必然报 ActiveX 错误
- 弹窗与第三方远程软件无关，纯 WSLg 兼容问题；弹窗是今天 WSL 更新后才出现的新问题

### 8.5 修复
```ini
# C:\Users\JsonCC\.wslconfig（新建）
[wsl2]
guiApplications=false
```
- 禁用 WSLg → msrdc 不再启动 → 弹窗绝迹；终端使用零影响
- 生效需 `wsl --shutdown` 或重启电脑（会关闭当前所有 WSL 会话，故从 Windows 侧执行）
- 需要 Linux GUI 应用时改回 true 即可（弹窗会回来，属 Win10 已知兼容问题，等微软修复）

### 8.6 WSL 版本与组件详情（wsl --version）
```
WSL 版本: 2.7.11.0       内核: 6.18.33.2-2      WSLg: 1.0.73.2
MSRDC: 1.2.7214           Direct3D: 1.611.1-81528511    DXCore: 10.0.26100.1
Windows: 10.0.19045.3803
```
- C:\Program Files\WSL 组件：msrdc.exe（3.4MB，签名 Microsoft）、WSLDVCPlugin.dll、RdpWinStlHelper.dll、libwsl.dll、msal.wsl.proxy.exe、wslg.rdp 等；目录时间戳 = 安装/更新时间（本次 8-14 10:11）

---

## 9. Hermes CLI 状态栏解读（会话截图逐项）

### 9.1 顶行（通知行）
- `Self-improvement review: Skill 'windows-wsl-admin' created.` —— 自我改进系统后台复盘复杂会话并自动沉淀技能的通知

### 9.2 底行（状态栏，从左到右）
| 元素 | 含义 |
|---|---|
| deepseek-v4-flash（黄色） | 当前主模型 |
| 99.9K/1M + [▓▓▓░░░...] 10% | 上下文用量：已用 99.9K token / 上限 1M，进度条 = 用量百分比 |
| 23m | 本会话已进行时长 |
| ⏱ 5m29s | 当前这轮回复的处理耗时 |
| ✓ 11m | 上次工具操作成功完成于 11 分钟前 |
| ⚠ YOLO（黄色） | 审批模式 = YOLO（免确认自动执行；未配置审批策略时的默认值） |
| — 回复OK两个字 #2 | 会话标题（取自第一条用户消息）+ 消息序号；#2 是标题冲突自动加的后缀 |

### 9.3 为什么标题一直在
会话标题默认 = 第一条用户消息，作为会话身份证常驻状态栏右侧，整个会话期间不变。想换：`hermes sessions rename` 或开新会话（/new）。

---

## 10. 关键命令速查

```bash
# Windows Terminal 指定目录启动（WSL 版，wt -d UNC 在 Win10 不可用）
wt.exe -p Ubuntu wsl.exe -d Ubuntu --cd "/mnt/d/xxx"

# 验证 wsl --cd 支持
wsl.exe --cd /tmp pwd

# 会话管理
hermes sessions list / rename <id> <标题> / delete <id>

# 视觉模型配置
hermes config set auxiliary.vision.model kimi-k3

# 代理下载 GitHub 资产（先查 api 再走代理，核对字节数 + 验签）
curl -L -o pkg "https://ghfast.top/https://github.com/<owner>/<repo>/releases/download/<tag>/<asset>"

# PowerShell 中文防乱码（UTF-16LE base64，Python 侧生成）
python3 -c "import base64; print(base64.b64encode('你的PS命令'.encode('utf-16-le')).decode())"

# 远程桌面服务状态
Get-Service TermService

# 验证新进程（PID+StartTime 前后对比，勿用 [bool]）
Get-Process -Name wsl | Select Id, StartTime | Sort StartTime
```

---

## 11. 产物清单

| 类型 | 位置/名称 | 说明 |
|---|---|---|
| 安装包备份 | D:\wt_install\ | msixbundle + UI.Xaml 依赖 + diag.txt |
| 路径转换脚本 | C:\Users\JsonCC\wt_open_here.ps1 | 右键「在 Ubuntu 中打开」核心（纯 ASCII，防编码坑） |
| WT 配置 | %LOCALAPPDATA%\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json | 隐藏了 Azure/重复 Ubuntu |
| WSL 配置 | C:\Users\JsonCC\.wslconfig | 禁用 WSLg（guiApplications=false）修复弹窗 |
| 技能 | windows-wsl-admin（software-development） | 5 个参考文件，含 WSLg/msrdc、编码、代理下载等坑 |
| 长期记忆 | Hermes memory（2 条） | 环境事实 + 看图配置 |

---

*整理自 Hermes 会话 20260814_114835_56ede6（184 条消息）——已与数据库中的 18 条用户提问逐条核对，覆盖全部问答内容*
