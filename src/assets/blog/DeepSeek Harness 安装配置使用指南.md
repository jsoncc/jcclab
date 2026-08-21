---
title: DeepSeek Harness 安装配置使用指南
date: 2026-08-22
tags:
  - DeepSeek
  - agent
  - 工具
  - Harness
---

# DeepSeek Harness 安装配置使用指南

> **一句话**：DeepSeek 官方开源的 agent 框架（`dsh`，目前 developer preview），本机已装好并接入 opencode-go 订阅，通过 Web UI（localhost:3080）使用；暂无官方快捷键体系，真正的"快捷键"在 CLI。

---

## 1. 是什么

- 官方仓库：`deepseek-ai/deepseek-harness`（TypeScript，MIT）
- 定位：agent harness（智能体框架），核心口号 "Everything is a Plugin"（一切皆插件），底层引擎 Cordis
- 状态：**developer preview**，迭代快、会有破坏性变更，不适合当生产主力；Hermes 仍是日常主力
- 前端自带提供商目录，**内置 opencode-go**（29 个模型含 deepseek-v4-flash/pro）

## 2. 安装（已完成）

```bash
npm install -g @deepseek-ai/dsh
```

| 项 | 值 |
|----|----|
| 命令位置 | `/home/jsoncc/.local/bin/dsh`（软链） |
| 程序目录 | `/home/jsoncc/.local/lib/node_modules/@deepseek-ai/dsh` |
| 磁盘占用 | 约 295 MB（在 WSL 虚拟磁盘内，即 C 盘 ext4.vhdx） |
| 数据目录 | `~/.dsh/`（首次运行自动创建） |
| 版本 | 0.1.1-rc.2（`dsh --version` 验证） |

运行时内存：Web UI 闲置约 100~300 MB（Node 进程）；跑任务时更高，浏览器标签页另算。模型走 API，不占本地显卡/模型内存。

## 3. 启动 / 停止

```bash
dsh web              # 启动 Web UI 并尝试打开浏览器（WSL 里可能报错，无害）
dsh web --no-open    # 启动但不弹浏览器（WSL 推荐）
```

- 默认地址：`http://127.0.0.1:3080`（WSL2 自动转发，Windows 浏览器直接访问）
- 停止：终端 Ctrl+C；后台方式启动时用任务管理器/`kill` 对应进程
- 注意：若由 Hermes 后台进程启动，Hermes 会话结束可能连带停止

## 4. 配置模型（接入 opencode-go 订阅）

**正确姿势（目录提供商，已踩坑确认）**：

1. Web UI → Settings → Models
2. 点「**Add provider**」（添加提供商，目录入口）
3. 列表里找 **opencode-go**（内置，不用自己建）
4. 填入 API Key（`OPENCODE_GO_API_KEY`，在 `~/.hermes/.env` 里），保存
5. 模型目录自动带出 29 个模型；deepseek 系列在 openai-completions 组：`deepseek-v4-flash`、`deepseek-v4-pro`（接口 `https://opencode.ai/zen/go/v1`，与 Hermes 一致）

**两个已知坑（本机实测）**：

- ❌ 把 opencode-go 的 key 填进官方「DeepSeek」卡片 → 报 `API key is invalid`（请求去了 DeepSeek 官方，key 不认）
- ❌ 用「Add a custom provider」新建、Provider ID 填 `opencode-go` → 提示"已有提供方使用了这个ID"（内置目录已占用）
- 模型名必须用裸名（`deepseek-v4-flash`），带 vendor 前缀会被接口 401

## 5. 使用流程

1. 左侧「工作区」→ 添加/选择一个项目目录（只有选了工作区，输入框才可用）
2. 点「新会话」→ 底部输入框发任务
3. 发送前确认模型选择器选的是 opencode-go 的 deepseek-v4-flash
4. agent 可读写工作区文件、跑命令、委派子任务；涉及操作会按权限策略询问
5. 会话历史会持久化，可恢复（复用 session 保留 Bash 进程状态）

## 6. CLI 命令速查（它的"快捷键"）

```bash
dsh --version                                   # 版本
dsh --help                                      # 启动器帮助
dsh web                                         # 启动 Web UI（= --profile web）
dsh --profile headless "任务描述"               # 一次性跑完打印结果退出（无服务器）
dsh --profile <名> --dump-config                # 打印组合后的配置树
dsh --profile <名> --patch <路径>               # 叠加补丁层启动
dsh plugin --profile <名> <pnpm args>           # 管理某 profile 的插件
```

- Web UI 参数跟在 `dsh web` 后面（如 `dsh web --no-open`、`dsh web --port 8080`）
- "当前目录"默认即工作区根目录

## 7. 快捷键现状（如实说明）

**dsh Web UI 目前没有官方快捷键体系**（预览版前端 bundle 未注册任何产品级快捷键，已核实）。现阶段操作以鼠标为主。可用的是：

- 浏览器通用：`Ctrl+C` 复制 / `Ctrl+V` 粘贴 / `Ctrl+F` 查找 / `F5` 刷新
- 输入框内换行/发送行为以界面为准（预览版可能调整）
- 真正可脚本化的是 **CLI**（见第 6 节），headless 模式适合无界面跑任务

## 8. Python SDK（编程方式）

```bash
pip install deepseek-harness-sdk
```

自带捆绑运行时（无需系统 Node），Python 3.10+。用 `DeepSeekHarness(provider=..., model=..., cwd=..., session_root=..., cordis=...)` 上下文管理器跑任务；复用 session id 会保留会话内 Bash 状态。适合把 agent 嵌进自己的脚本。

## 9. 数据 / 配置位置

| 路径 | 内容 |
|------|------|
| `~/.dsh/settings.yaml` | 界面设置 |
| `~/.dsh/.credentials.yaml` | 各 provider 的密钥引用（只写不可读回） |
| `~/.dsh/profiles/web/` | web profile（bundle 组合 + 用户补丁层） |
| `~/.dsh/storages/` | 工作区/会话索引 |

备份 = 打包整个 `~/.dsh/`。

## 10. 卸载

```bash
npm rm -g @deepseek-ai/dsh
rm -rf ~/.dsh        # 数据目录随删（先确认不要保留）
```

## 11. 与本机其他工具的关系

- 与 Hermes（`~/.hermes`）完全独立：不同生态（Node vs Python）、不同数据目录、互不干扰
- 与 opencode-go 订阅**共享同一份配额**：Hermes 和 dsh 调用的是同一个订阅池
- 文档流动：本篇若同步到 jcclab 博客，走既定 obsidian→jcclab 同步流程