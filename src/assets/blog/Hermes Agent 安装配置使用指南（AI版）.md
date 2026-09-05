---
category: ai-agent
title: Hermes Agent 安装配置使用指南（AI 可执行版）
tags:
  - Hermes
  - Agent
  - 安装
  - AI
---

# Hermes Agent 安装配置使用指南（AI 可执行版）

> 适用场景：全新安装的 Windows 10 专业版 + WSL2 + Ubuntu
> 执行方式：**以管理员身份运行 PowerShell**，逐节执行命令，每节末尾验证
> 目标：装好 WSL2 + Ubuntu → 安装 Hermes Agent → 配置 opencode Go 订阅
> 模型来源：opencode Go 订阅（provider: `opencode-go`，模型：`deepseek-v4-flash`）
> 整理日期：2026-08-13

---

## ⚠️ 执行须知（AI 先读这里）

1. **全程用管理员 PowerShell**（只有第 4 节之后在 WSL 内执行）：开始菜单搜 "PowerShell" → 右键 → "以管理员身份运行"
2. **每节末尾必须执行"验证"命令**，输出符合预期才继续下一节；验证失败先看本节"排错"
3. **wsl --install 之后需要重启电脑**（第 2 节会明确提示），AI 执行到这里必须停下来通知用户重启
4. 环境变量修改后**必须重开终端**才生效（本指引每节之间默认会重开）
5. **需要用户手动参与的地方**（如输入 API key、创建 Linux 用户名密码），AI 要停下来请用户操作，不要瞎猜
6. 国内网络下 git clone 可能报 `GnuTLS recv error (-110)`——见第 4 节"网络坑"，先配置再安装

---

## 0️⃣ 准备工作

### 0.1 确认系统版本与架构（64 位）

```powershell
systeminfo | Select-String "OS Name|系统型号|System Type"
```

确认是 Windows 10 22H2（build 19045）或 Windows 11，64 位。

### 0.2 确认网络可达性

```powershell
Test-NetConnection github.com -Port 443 -InformationLevel Quiet
Test-NetConnection hermes-agent.nousresearch.com -Port 443 -InformationLevel Quiet
Test-NetConnection opencode.ai -Port 443 -InformationLevel Quiet
```

- 三个都返回 `True` → 继续
- 有 `False` → 国内网络建议配置代理后重试（或按第 4 节网络坑处理）

### 0.3 确认磁盘空间

```powershell
Get-PSDrive C | Select-Object @{n='剩余GB';e={[math]::Round($_.Free/1GB,1)}}
```

WSL2 + Hermes 约需 6~7 GB，剩余不足 10 GB 先清理磁盘。

### 0.4 确认 WSL 是否已安装（复用检查）

```powershell
wsl --list --verbose
```

- 正常列出发行版且 VERSION 列是 2 → **已装好，跳到第 3 节**
- 提示"未安装"或"没有已安装的分发版" → 继续第 1 节

---

## 1️⃣ 启用 WSL 功能（Windows 侧）

**管理员 PowerShell 执行：**

```powershell
wsl --install
```

- 该命令自动启用"适用于 Linux 的 Windows 子系统"和"虚拟机平台"两个 Windows 功能，并下载 WSL2 内核
- 提示 **"正在下载 WSL 内核"** 是正常的，等待完成

**验证：**

```powershell
wsl --status
```

正常输出 WSL 版本信息（含 "默认版本: 2" 或类似内容）。

**排错：**
- 提示需要启用虚拟化 → 进 BIOS 开启 Intel VT-x / AMD-V，然后重试
- 提示"此操作需要提升权限" → 确认当前是管理员 PowerShell
- 下载慢/失败 → 网络问题，重试或配代理

---

## 2️⃣ 安装 Ubuntu 发行版并重启

**管理员 PowerShell 执行：**

```powershell
wsl --install -d Ubuntu
```

- 会自动下载并安装 Ubuntu（默认最新 LTS 版）
- 安装完成后**提示设置 Linux 用户名/密码**，或提示"安装成功，请重启"

**⚠️ 到这里必须暂停，通知用户重启电脑（重启后才能继续第 3 节）**

重启后：
1. 开始菜单搜索 **Ubuntu**，打开
2. 首次启动会让你**创建 Linux 用户名和密码**（例：用户名 `jsoncc`，密码自己定，Linux 密码输入时屏幕不显示字符，是正常的）
3. 记住这个用户名，后面配置要用

**验证（进入 Ubuntu 终端后）：**

```bash
whoami
```

正常输出刚才创建的用户名（如 `jsoncc`）。

**排错：**
- 打开 Ubuntu 报错"WSL 内核版本太旧" → 管理员 PowerShell 执行 `wsl --update` 更新内核
- 打开 Ubuntu 白屏/卡住 → 管理员 PowerShell 执行 `wsl --shutdown` 后重开

---

## 3️⃣ 配置 WSL（systemd + 默认用户）

### 3.1 确认是 WSL2（不是 WSL1）

**管理员 PowerShell 执行：**

```powershell
wsl --list --verbose
```

VERSION 列应为 **2**。若是 1，执行：

```powershell
wsl --set-version Ubuntu 2
```

### 3.2 编辑 /etc/wsl.conf（启用 systemd）

**在 Ubuntu 终端内执行**（用 tee 覆盖写入，避免交互式编辑器卡住 AI）：

```bash
sudo tee /etc/wsl.conf > /dev/null << 'EOF'
[boot]
systemd=true
[interop]
enabled=true
appendWindowsPath=true
[user]
default=<你的Linux用户名>
EOF
```

> 把 `<你的Linux用户名>` 换成第 2 节创建的用户名（如 `jsoncc`）。
> 首次使用 sudo 会要求输入 Linux 密码。

**验证写入正确：**

```bash
cat /etc/wsl.conf
```

应显示刚才写入的四段内容（boot/interop/user）。

### 3.3 重启 WSL 使配置生效

**管理员 PowerShell 执行：**

```powershell
wsl --shutdown
```

等 5 秒，重新打开 Ubuntu 终端。

**验证 systemd 已运行（Ubuntu 终端内）：**

```bash
ps -p 1 -o comm=
```

应输出 `systemd`。若输出 `init` 或其他，说明 systemd 没启用，回到 3.2 检查 wsl.conf。

**排错：**
- wsl.conf 没生效 → 确认文件里 `systemd=true` 在 `[boot]` 段下、没有多余空行，然后重新 `wsl --shutdown` 再开
- `sudo tee` 报权限错误 → 确认在 Ubuntu 终端内（不是 PowerShell），且用户有 sudo 权限

---

## 4️⃣ 安装 Hermes Agent

### 4.0 网络坑（国内网络必看，先配置再安装）

国内网络下 git clone 可能报 `GnuTLS recv error (-110)`，先执行：

```bash
git config --global http.version HTTP/1.1
git config --global http.postBuffer 524288000
```

### 4.1 安装（在 Ubuntu 终端内执行）

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash -s -- --skip-setup
source ~/.bashrc
```

> `--skip-setup` 跳过交互式配置阶段（API key 和模型由第 5 节用命令配置，这样全程非交互、AI 可执行）。
> 安装器自动完成：uv、Python 3.11、git、Node.js 22、ripgrep、ffmpeg，无需手动安装。

**验证：**

```bash
hermes --version
```

正常输出 `Hermes Agent v0.x.x (...)`。

**排错：**
- `GnuTLS recv error (-110)` → 确认执行了 4.0 的两条 git config，然后重跑安装器
- 安装中途网络断 → 重跑安装器（已下载的部分会复用，不会重复下载）
- `hermes: command not found` → 确认执行了 `source ~/.bashrc`；仍不行就重开终端

---

## 5️⃣ 配置 opencode Go（API key + 模型）

> **需要用户手动操作：** opencode Go 订阅需要付费账号。若用户还没有订阅，AI 在这里停下来，请用户到 opencode.ai 注册订阅并创建 API key（形如 `sk-...`），创建好后把 key 给 AI 继续。一个 workspace 限一人订阅。

### 5.1 写入 API key（在 Ubuntu 终端内执行）

```bash
mkdir -p ~/.hermes
echo "OPENCODE_GO_API_KEY=sk-你的key" >> ~/.hermes/.env
```

> 把 `sk-你的key` 换成用户提供的真实 key。
> 若 `~/.hermes/.env` 已存在，先 `cat ~/.hermes/.env` 确认不重复追加。

**验证（确认 key 已写入且无重复）：**

```bash
grep -c "OPENCODE_GO_API_KEY" ~/.hermes/.env
```

应输出 `1`（只出现一次）。

### 5.2 配置模型与 provider（用命令，不手动编辑 config.yaml）

```bash
hermes config set model.provider opencode-go
hermes config set model.default deepseek-v4-flash
hermes config set model.api_mode chat_completions
hermes config set auxiliary.title_generation.provider opencode-go
hermes config set auxiliary.title_generation.model deepseek-v4-flash
hermes config set auxiliary.compression.provider opencode-go
hermes config set auxiliary.compression.model deepseek-v4-flash
```

> 辅助模型（会话标题、上下文压缩等）统一设为 `deepseek-v4-flash`，可省额度。
> 用 `hermes config set` 修改配置，**不要手动编辑 config.yaml**（容易写坏缩进）。

**验证：**

```bash
hermes config get model
```

应输出类似：

```
provider: opencode-go
default: deepseek-v4-flash
api_mode: chat_completions
```

### 5.3 验证配置生效（试运行一次）

```bash
hermes -z "回复OK两个字"
```

应输出 `OK` 或类似简短回复，说明 key、provider、模型全部打通。

**排错：**
- 报 `401`/`Unauthorized`/`invalid api key` → key 写错，检查 5.1 的 `~/.hermes/.env` 内容
- 报连接超时/`Connection error` → 网络问题，检查 0.2 的三个域名连通性
- 报 `model not found`/`unknown model` → 用 `hermes model` 查看该订阅下可用模型列表，换个模型名重设

**可用模型**（Go 订阅内，`hermes model` 可查实时列表）：
`deepseek-v4-pro`、`deepseek-v4-flash`、`qwen3.7-max`、`qwen3.7-plus`、`kimi-k3`、`kimi-k2.7-code`、`glm-5.2`、`glm-5.1`、`minimax-m3`、`minimax-m2.7`、`grok-4.5` 等

---

## 6️⃣ 总体验收清单（全部做完后逐项确认）

| 步骤 | 验证命令 | 预期输出 | 在哪执行 |
|------|----------|----------|----------|
| WSL2 已启用 | `wsl --status` | 含 WSL 版本信息 | PowerShell |
| Ubuntu 已装 | `wsl --list --verbose` | Ubuntu 行 VERSION=2 | PowerShell |
| systemd 已启用 | `ps -p 1 -o comm=` | `systemd` | Ubuntu |
| Hermes 已装 | `hermes --version` | `Hermes Agent v0.x.x (...)` | Ubuntu |
| API key 已写入 | `grep -c OPENCODE_GO_API_KEY ~/.hermes/.env` | `1` | Ubuntu |
| 模型已配置 | `hermes config get model` | provider: opencode-go / default: deepseek-v4-flash | Ubuntu |
| 端到端打通 | `hermes -z "回复OK两个字"` | 有简短回复 | Ubuntu |

> AI 执行完毕：逐条运行上表命令，全部符合预期才算安装成功。

---

## 7️⃣ 常见问题速查

| 现象 | 原因 | 解决 |
|------|------|------|
| `wsl --install` 提示需要虚拟化 | BIOS 里 VT-x/AMD-V 未开 | 进 BIOS 开启虚拟化后重试 |
| Ubuntu 报"内核版本太旧" | WSL 内核旧 | PowerShell 执行 `wsl --update` |
| `ps -p 1` 输出不是 systemd | wsl.conf 没生效 | 检查 3.2 配置，`wsl --shutdown` 后重开 |
| `GnuTLS recv error (-110)` | 国内网络 git 问题 | 执行 4.0 两条 git config 后重跑安装 |
| `hermes: command not found` | PATH 没生效 | `source ~/.bashrc` 或重开终端 |
| 报 `401`/invalid api key | key 写错 | 检查 `~/.hermes/.env` 的 OPENCODE_GO_API_KEY |
| 报 model not found | 模型名不在订阅内 | `hermes model` 看列表，换模型名 |
| `hermes -z` 连接超时 | 网络不通 | 检查 0.2 三个域名连通性，配代理 |
| 想更新 Hermes | 版本落后 | `hermes update`（或先 `hermes update --check`） |
| 想体检环境 | 排查依赖问题 | `hermes doctor` |

---

## 8️⃣ 日常使用速查

| 操作 | 命令 |
|------|------|
| 进入对话 | `hermes` |
| 恢复最近会话 | `hermes -c` |
| 会话内切换模型 | `/model <模型名>` |
| 更换默认模型/提供商 | `hermes model` |
| 一次性提问（脚本/测试） | `hermes -z "问题"` |
| 环境自检 | `hermes doctor` |
| 查看日志 | `hermes logs` |
| 更新到最新版 | `hermes update` |

**用量上限提醒**：Go 订阅为 5 小时 $12 / 每周 $30 / 每月 $60，超出会被限流（免费模型可继续用）。

---

*文档结束。执行中遇到本指南未覆盖的问题，把报错原文发给 AI 协助处理。*


