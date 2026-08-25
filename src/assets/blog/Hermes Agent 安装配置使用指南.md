---
title: Hermes Agent 安装配置使用指南
tags:
  - Hermes
  - Agent
  - 安装
---

# Hermes Agent 安装配置使用指南

> 环境：Windows 10 22H2（build 19045）+ WSL2 + Ubuntu 26.04 LTS
> 模型来源：opencode Go 订阅（provider: `opencode-go`，模型：`deepseek-v4-flash`）

## 1. 概述

- **Hermes Agent**：Nous Research 开源的自主 AI 智能体框架（MIT），内置技能/记忆学习循环，非单一模型，可接入任意 LLM 提供商。
- **opencode Go**：opencode 的低价订阅（首月 $5，之后 $10/月），开放 OpenAI 兼容 API 端点 `https://opencode.ai/zen/go/v1`。
- **接入方式**：Hermes 原生支持 `opencode-go` 作为一等公民 provider，无需手动配自定义端点。
- **为什么用 WSL2**：更接近 Linux 原生环境，Dashboard 终端面板等 POSIX 功能可用。

## 2. 前置准备

- Windows 10 22H2+ 或 Windows 11（64 位）
- 可访问 `github.com`、`hermes-agent.nousresearch.com`、`opencode.ai`（国内网络建议配代理）
- opencode Go 订阅 + API key（形如 `sk-...`，在 opencode.ai/auth 创建；一个 workspace 限一人订阅）
- 磁盘预算：WSL2 + Hermes 约需 6~7 GB

## 3. WSL2 安装

**管理员 PowerShell** 执行：

```powershell
wsl --install -d Ubuntu
```

- 提示时**重启电脑**
- 重启后首次进入 Ubuntu，创建 Linux 用户名/密码（本例：`jsoncc`，与 Windows 账号无关）
- 确认是 WSL2（不是 WSL1）：

```powershell
wsl --list --verbose
# VERSION 列应为 2
```

**启用 systemd 和默认用户**，编辑 `/etc/wsl.conf`：

```ini
[boot]
systemd=true
[interop]
enabled=true
appendWindowsPath=true
[user]
default=jsoncc
```

生效：

```powershell
wsl --shutdown
```

重开 WSL 验证 systemd 已运行：

```bash
ps -p 1 -o comm=     # 应输出 systemd
```

## 4. Hermes Agent 安装

**在 WSL 内**（非 Windows）执行：

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
source ~/.bashrc
```

安装器自动完成：uv、Python 3.11、Node.js、Git、ripgrep、ffmpeg，无需手动安装。

> **网络坑（实测必踩）**：国内网络下 git clone 可能报 `GnuTLS recv error (-110)`，先执行：
> ```bash
> git config --global http.version HTTP/1.1
> git config --global http.postBuffer 524288000
> ```
> 再重跑安装器即可。

验证：

```bash
hermes --version     # Hermes Agent v0.20.0 ...
```

> `hermes` 命令位于 `~/.local/bin/hermes`，PATH 已由安装脚本写入 `~/.bashrc`（交互终端自动生效）。

## 5. 配置 opencode Go

**写入 API key**，编辑 `~/.hermes/.env`：

```bash
OPENCODE_GO_API_KEY=sk-你的key
```

**配置模型**，编辑 `~/.hermes/config.yaml`：

```yaml
model:
  provider: opencode-go
  default: deepseek-v4-flash
  api_mode: chat_completions
auxiliary:
  title_generation:
    provider: opencode-go
    model: deepseek-v4-flash
  compression:
    provider: opencode-go
    model: deepseek-v4-flash
```

- 辅助模型（会话标题、上下文压缩等）默认也走主模型，统一设为 `deepseek-v4-flash` 可省额度。
- 也可用交互向导 `hermes model` → 选 **OpenCode Go** → 挑模型。

验证：

```bash
hermes config get model
# provider: opencode-go
# default: deepseek-v4-flash
```

**可用模型**（Go 订阅内）：`deepseek-v4-pro`、`deepseek-v4-flash`、`qwen3.7-max`、`qwen3.7-plus`、`kimi-k3`、`kimi-k2.7-code`、`glm-5.2`、`glm-5.1`、`minimax-m3`、`minimax-m2.7`、`grok-4.5` 等（`hermes model` 或端点 `/v1/models` 可查实时列表）。

## 6. 日常使用

| 操作 | 命令 |
|---|---|
| 进入对话 | `hermes` |
| 会话内切换模型 | `/model <模型名>` |
| 更换默认模型/提供商 | `hermes model` |
| 一次性提问（脚本/测试） | `hermes -z "问题"` |
| 环境自检 | `hermes doctor` |

**用量上限提醒**：Go 订阅为 5 小时 $12 / 每周 $30 / 每月 $60，超出会被限流（免费模型可继续用）。`deepseek-v4-flash` 是额度最划算的模型之一。

## 7. Hermes 常用命令速查

### 7.1 启动与进入会话

| 命令 | 说明 |
|------|------|
| `hermes` | 进入交互式对话（默认开新会话） |
| `hermes -c` | **恢复最近一次会话**（最常用，相当于"接着上次聊"） |
| `hermes -c "标题"` | 按标题恢复指定会话 |
| `hermes -r <会话ID>` | 按 ID 恢复指定会话，如 `hermes -r 20260808_034248_a8112a` |
| `hermes sessions list` | 列出所有历史会话（标题/工作区/最后活跃/ID） |
| `hermes sessions browse` | 交互式选择器，上下键挑一个回车进入 |
| `hermes chat -q "问题"` | 单次提问，不进入交互界面（适合脚本） |
| `hermes --model <模型>` | 本次会话临时切换模型 |

> 会话机制要点：
> - 每个会话有唯一 ID（日期时间_随机码），不是按路径区分
> - 恢复会话时会自动回到该会话记录的工作目录（不想这样加 `--no-restore-cwd`）
> - 会话内运行 `/sessions` 会**排除当前会话自己**（设计如此）
> - 不同会话的对话历史不共享；但长期记忆和技能是全局共享的

### 7.2 配置与管理

| 命令 | 说明 |
|------|------|
| `hermes setup` | 设置向导（模型/终端/网关等） |
| `hermes model` | 交互式选择模型/服务商 |
| `hermes config set 键 值` | 修改配置（不要手动编辑 config.yaml） |
| `hermes config show` | 查看当前配置 |
| `hermes doctor` | 体检，检查依赖和配置问题 |
| `hermes fallback list` | 查看备用模型链 |
| `hermes skills list` | 查看已安装技能 |
| `hermes cron list` | 查看定时任务 |
| `hermes logs` | 查看日志 |
| `hermes update` | 更新 Hermes 到最新版 |

### 7.3 会话内斜杠命令（输入 / 开头）

| 命令 | 说明 |
|------|------|
| `/new` | 开新会话 |
| `/resume` | 浏览并恢复历史会话 |
| `/sessions` | 查看最近会话列表 |
| `/title 名字` | 给当前会话命名（方便以后按标题恢复） |
| `/model` | 切换模型 |
| `/compress` | 压缩上下文（会话太长时用） |
| `/status` | 查看会话状态、模型、token 用量 |
| `/copy` | 复制上一条 AI 回复到剪贴板 |
| `/paste` | 把剪贴板图片附加到对话 |
| `/image 路径` | 附加本地图片 |
| `/memory` | 查看长期记忆 |
| `/yolo` | 跳过危险命令确认 |
| `/help` | 列出当前会话支持的全部命令 |
| `/quit` | 退出会话 |

> 记不住命令时，随时输入 `/help` 查看完整列表。

### 7.4 其他界面入口

| 命令 | 说明 |
|------|------|
| `hermes desktop` / `hermes gui` | 打开桌面版应用 |
| `hermes dashboard` | 打开网页管理面板 |
| `hermes --tui` | 使用全屏 TUI 界面 |
| `hermes chat -q "..." -Q` | 静默单次提问 |
