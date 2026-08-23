# ⌨️ OpenCode 命令与快捷键手册

CLI 命令 · TUI 快捷键 · 实用技巧

适用于 Windows / macOS / Linux

### 📑 快速导航

-   [CLI 命令](#cli-commands)
-   [TUI 命令](#tui-commands)
-   [快捷键](#shortcuts)
-   [文件引用](#file-refs)
-   [环境变量](#env-vars)
-   [实用技巧](#tips)

## 💻 CLI 常用命令

> 💡 **提示**：直接在终端运行 `opencode` 启动 TUI 界面，无参数时默认进入交互模式。

### 启动与运行

| 命令 | 说明 |
| --- | --- |
| `opencode` | 启动 TUI 界面（当前目录） |
| `opencode /path/to/project` | 启动 TUI 并指定项目目录 |
| `opencode run "问题内容"` | 非交互模式，直接运行单次查询 |
| `opencode run -c` | 继续上一次会话 |

### 会话管理

| 命令 | 说明 | 分类 |
| --- | --- | --- |
| `opencode session list` | 列出所有会话 | 会话管理 |
| `opencode session delete <ID>` | 删除指定会话 | 会话管理 |
| `opencode export [sessionID]` | 导出会话为 JSON | 导出 |
| `opencode import <file>` | 从 JSON 文件或分享链接导入会话 | 导入 |

### 模型与 Provider

| 命令 | 说明 | 分类 |
| --- | --- | --- |
| `opencode models` | 列出所有可用模型 | 模型查询 |
| `opencode models anthropic` | 查看指定 Provider 的模型 | 模型查询 |
| `opencode models --refresh` | 刷新模型缓存 | 模型查询 |
| `opencode auth login` | 登录 Provider 并配置 API Key | 认证 |
| `opencode auth list` | 查看已保存的凭证 | 认证 |
| `opencode auth logout` | 登出 Provider | 认证 |

### MCP 服务器

| 命令 | 说明 | 分类 |
| --- | --- | --- |
| `opencode mcp add` | 添加 MCP 服务器 | MCP 管理 |
| `opencode mcp list` | 列出已配置的 MCP 服务器 | MCP 管理 |
| `opencode mcp auth [name]` | 认证 OAuth 启用的 MCP 服务器 | MCP 认证 |
| `opencode mcp logout [name]` | 移除 MCP 服务器的 OAuth 凭证 | MCP 认证 |

### Agent 管理

| 命令 | 说明 | 分类 |
| --- | --- | --- |
| `opencode agent create` | 创建自定义 Agent | Agent |
| `opencode agent list` | 列出所有可用 Agent | Agent |

### 实用工具

| 命令 | 说明 | 分类 |
| --- | --- | --- |
| `opencode stats` | 查看 Token 用量和成本统计 | 统计 |
| `opencode stats --days 7` | 查看最近 7 天统计 | 统计 |
| `opencode plugin <module>` | 安装插件 | 插件 |
| `opencode github install` | 在仓库中安装 GitHub Agent | GitHub |
| `opencode pr <number>` | Fetch 并 checkout GitHub PR 分支 | GitHub |

### 服务器模式

| 命令 | 说明 | 使用场景 |
| --- | --- | --- |
| `opencode serve` | 启动无头 HTTP 服务器 | API 访问、远程调用 |
| `opencode web` | 启动带 Web 界面的服务器 | 浏览器访问 |
| `opencode attach [url]` | 附加到运行中的服务器 | 多终端共享后端 |

### 系统命令

| 命令 | 说明 | 分类 |
| --- | --- | --- |
| `opencode upgrade` | 升级到最新版本 | 系统 |
| `opencode upgrade v0.1.48` | 升级到指定版本 | 系统 |
| `opencode uninstall` | 卸载 OpenCode | 系统 |
| `opencode db path` | 查看数据库路径 | 调试 |

### 全局 Flags

| Flag | 简写 | 说明 |
| --- | --- | --- |
| `--help` | `-h` | 显示帮助信息 |
| `--version` | `-v` | 打印版本号 |
| `--print-logs` |  | 输出日志到 stderr |
| `--log-level` |  | 设置日志级别（DEBUG/INFO/WARN/ERROR） |
| `--pure` |  | 不使用外部插件运行 |

## 🖥️ TUI 斜杠命令

> 💡 **使用方式**：在 TUI 中输入 `/` 后接命令名，或使用对应的快捷键。

### 会话操作

| 命令 | 快捷键 | 说明 |
| --- | --- | --- |
| `/new` | `Ctrl+X N` | 开始新会话（别名：/clear） |
| `/sessions` | `Ctrl+X L` | 列出并切换会话（别名：/resume, /continue） |
| `/exit` | `Ctrl+X Q` | 退出 OpenCode（别名：/quit, /q） |

### 撤销与重做

| 命令 | 快捷键 | 说明 |
| --- | --- | --- |
| `/undo` | `Ctrl+X U` | 撤销最后一条消息和文件更改 |
| `/redo` | `Ctrl+X R` | 重做之前撤销的操作 |

> ⚠️ **注意**：`/undo` 和 `/redo` 需要项目是 Git 仓库，因为内部使用 Git 管理文件更改。

### 模型与主题

| 命令 | 快捷键 | 说明 |
| --- | --- | --- |
| `/models` | `Ctrl+X M` | 列出可用模型 |
| `/themes` | `Ctrl+X T` | 列出可用主题 |
| `/connect` |  | 添加 Provider 和 API Key |

### 实用工具

| 命令 | 快捷键 | 说明 |
| --- | --- | --- |
| `/compact` | `Ctrl+X C` | 压缩当前会话（别名：/summarize） |
| `/share` |  | 分享当前会话 |
| `/unshare` |  | 取消分享会话 |
| `/export` | `Ctrl+X X` | 导出对话为 Markdown |
| `/init` |  | 创建或更新 AGENTS.md |
| `/help` |  | 显示帮助对话框 |
| `/details` |  | 切换工具执行详情显示 |
| `/thinking` |  | 切换思考/推理块显示 |
| `/editor` | `Ctrl+X E` | 使用外部编辑器编写消息 |

## ⚡ 常用快捷键

### Leader 快捷键（Ctrl+X 开头）

| 快捷键 | 功能 | 对应命令 |
| --- | --- | --- |
| `Ctrl+X N` | 新建会话 | `/new` |
| `Ctrl+X L` | 列出/切换会话 | `/sessions` |
| `Ctrl+X U` | 撤销 | `/undo` |
| `Ctrl+X R` | 重做 | `/redo` |
| `Ctrl+X M` | 选择模型 | `/models` |
| `Ctrl+X T` | 选择主题 | `/themes` |
| `Ctrl+X C` | 压缩会话 | `/compact` |
| `Ctrl+X E` | 外部编辑器 | `/editor` |
| `Ctrl+X X` | 导出对话 | `/export` |
| `Ctrl+X Q` | 退出 | `/exit` |

### 其他快捷键

| 快捷键 | 说明 |
| --- | --- |
| `Ctrl + P` | 打开命令面板（搜索命令） |
| `Ctrl + T` | 切换模型变体（推理强度） |
| `Tab` | Plan / Build 模式切换 |
| `@` | 模糊搜索并引用文件 |
| `!` | 直接运行 Shell 命令 |
| `/` | 打开斜杠命令列表 |

> 💡 **Leader Timeout**：默认情况下，按下 `Ctrl+X` 后有 2000ms 时间按下第二个键。可在 `tui.json` 中通过 `leader_timeout` 调整。

## 📁 文件引用与 Bash 命令

### 文件引用（@）

```
# 引用单个文件
@src/components/Button.tsx

# 引用多个文件
@src/api/index.ts @src/utils/helpers.ts

# 使用模糊搜索
@UserService  (自动匹配 UserService.java)
```

文件内容会自动添加到对话上下文中。

### Bash 命令（!）

```
# 直接运行命令
!ls -la
!npm install
!git status

# 命令输出会作为工具结果添加到对话中
```

### 配置引用别名

在 `opencode.json` 中配置引用别名后，可使用 `@alias` 快速引用：

```
# 配置后使用
@docs/README.md
@src/
```

## 🔧 常用环境变量

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| `OPENCODE_CONFIG` | 自定义配置文件路径 | `/path/to/config.json` |
| `OPENCODE_TUI_CONFIG` | 自定义 TUI 配置文件路径 | `/path/to/tui.json` |
| `OPENCODE_SERVER_PASSWORD` | 启用 HTTP Basic Auth | `your_password` |
| `OPENCODE_AUTO_SHARE` | 自动分享会话 | `true` |
| `OPENCODE_DISABLE_AUTOUPDATE` | 禁用自动更新检查 | `true` |
| `OPENCODE_DISABLE_MOUSE` | 禁用 TUI 鼠标捕获 | `true` |
| `EDITOR` | 设置外部编辑器 | `code --wait` |

### Windows PowerShell 设置示例

```powershell
# 设置外部编辑器为 VS Code
$env:EDITOR = "code --wait"

# 设置服务器密码
$env:OPENCODE_SERVER_PASSWORD = "your_password"

# 永久设置：添加到 PowerShell 配置文件
Add-Content $PROFILE '$env:EDITOR = "code --wait"'
```

## 💡 实用技巧

> **快速开始新项目**
> 使用 `/init` 命令让 OpenCode 分析项目并生成 `AGENTS.md` 文件，帮助 AI 理解项目结构。

> **节省 Token**
> 使用 `/compact` 压缩长会话，或使用 `opencode run` 进行简单查询而非启动完整 TUI。

> **多设备同步**
> 使用 `/share` 生成分享链接，在另一台设备上用 `opencode import` 导入会话继续工作。

> **外部编辑器**
> 长消息使用 `/editor` 在 VS Code 等编辑器中编写，体验更好。

> **避免冷启动**
> 使用 `opencode serve` 后台运行服务器，多个 `opencode run --attach` 共享同一后端。

> **查看用量**
> 定期运行 `opencode stats --days 7` 查看最近用量，控制成本。

### 编辑器配置

设置 `EDITOR` 环境变量以使用 `/editor` 和 `/export` 命令：

| 编辑器 | 配置命令 |
| --- | --- |
| VS Code | `export EDITOR="code --wait"` |
| Cursor | `export EDITOR="cursor --wait"` |
| Vim | `export EDITOR=vim` |
| NeoVim | `export EDITOR=nvim` |
| Windows Notepad | `set EDITOR=notepad` |

* * *
