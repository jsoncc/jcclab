---
title: OpenCode Skills 全局配置完整操作文档
category: ai-agent
tags:
  - OpenCode
  - Skills
  - 配置
---

# OpenCode Skills 全局配置完整操作文档

**📌 本文档用途：**记录如何在 Windows 上配置 OpenCode Skills 全局路径，让所有项目都能使用同一套 Skills，且内容存储在 D 盘不占用 C 盘空间。

* * *

## 一、什么是 OpenCode Skills

Skills 是 OpenCode 的**可复用能力模块**，类似于插件或扩展，用于增强 AI Agent 的特定任务处理能力。

### 1.1 Skills 的作用

| 类别 | 示例 Skills | 用途 |
| --- | --- | --- |
| **文档处理** | docx, pdf, pptx, xlsx | 创建/编辑 Word、PDF、PPT、Excel 文件 |
| **前端开发** | frontend-design, web-artifacts-builder | 创建精美 UI 界面、React 组件 |
| **创意设计** | canvas-design, algorithmic-art, theme-factory | 生成算法艺术、视觉设计、主题样式 |
| **开发工具** | mcp-builder, webapp-testing, claude-api | 构建 MCP 服务器、测试 Web 应用 |
| **企业沟通** | internal-comms, doc-coauthoring | 撰写内部通讯、协作文档 |

### 1.2 Skills 的格式

每个 Skill 是一个文件夹，包含 `SKILL.md` 文件：

```
skill-name/
└── SKILL.md
```

`SKILL.md` 文件结构：

```
---
name: skill-name
description: 技能描述，说明何时使用此技能
---

# 技能名称

## 何时使用
描述使用场景

## 操作步骤
1. 第一步
2. 第二步
```

* * *

## 二、OpenCode Skills 发现机制

OpenCode 会从以下**固定路径**自动发现 Skills：

### 2.1 全局路径（所有项目可用）

| 类型 | 路径 |
| --- | --- |
| OpenCode 全局 | `~/.config/opencode/skills/` |
| Claude 兼容 | `~/.claude/skills/` |
| Agent 兼容 | `~/.agents/skills/` |

### 2.2 项目路径（仅当前项目可用）

| 类型 | 路径 |
| --- | --- |
| OpenCode 项目 | `.opencode/skills/` |
| Claude 兼容 | `.claude/skills/` |
| Agent 兼容 | `.agents/skills/` |

**⚠️ 重要：** OpenCode **不支持**在配置文件中自定义 Skills 路径。只能通过上述固定路径或使用符号链接实现自定义位置。

* * *

## 三、方案选择：为什么使用符号链接

### 3.1 需求分析

| 需求 | 直接复制 | 符号链接 |
| --- | --- | --- |
| 所有项目都能用 | ✅ 放全局路径即可 | ✅ 放全局路径即可 |
| 内容在 D 盘 | ❌ C 盘占用大 | ✅ 内容在 D 盘 |
| C 盘占用 | ❌ 完整复制（数百 MB） | ✅ 仅链接（~200 字节） |
| 更新方便 | ❌ 需同步多处 | ✅ 改源目录即可 |

### 3.2 符号链接原理

```
C:\Users\JsonCC\.config\opencode\skills
         │
         │ （符号链接）
         ▼
D:\projects\skills
```

访问 C 盘路径时，系统自动重定向到 D 盘实际内容。

**✅ 优势：**

-   C 盘只占用约 200 字节（链接本身）
-   所有内容实际存储在 D 盘
-   所有项目运行 OpenCode 都能发现 Skills
-   更新 Skills 只需改 D 盘源目录

* * *

## 四、完整操作步骤

### 4.1 准备 Skills 源目录

将 Skills 放在 D 盘指定位置：

```powershell
# 目标结构
D:\projects\skills\
├── algorithmic-art\
├── brand-guidelines\
├── canvas-design\
├── claude-api\
├── doc-coauthoring\
├── docx\
├── find-skills\
├── frontend-design\
├── internal-comms\
├── mcp-builder\
├── pdf\
├── pptx\
├── skill-creator\
├── slack-gif-creator\
├── theme-factory\
├── web-artifacts-builder\
├── webapp-testing\
└── xlsx\
```

**📦 获取 Skills：**

-   从 [anthropics/skills](https://github.com/anthropics/skills) 克隆官方 Skills
-   从 [vercel-labs/skills](https://github.com/vercel-labs/skills) 克隆 Vercel Skills
-   使用 `npx skills add` 安装单个 Skill 后移动

### 4.2 删除现有目标文件夹（如有）

```powershell
Remove-Item "C:\Users\JsonCC\.config\opencode\skills" -Force -ErrorAction SilentlyContinue
```

### 4.3 创建符号链接（需要管理员权限）

**方法一：使用 mklink /J（目录连接点，推荐）**

```powershell
cmd /c "mklink /J C:\Users\JsonCC\.config\opencode\skills D:\projects\skills"
```

**方法二：使用 mklink /D（目录符号链接）**

```powershell
cmd /c "mklink /D C:\Users\JsonCC\.config\opencode\skills D:\projects\skills"
```

**💡 区别：**

-   `/J` 创建目录连接点（Junction），兼容性更好
-   `/D` 创建目录符号链接（Symbolic Link），功能更完整
-   两者在 OpenCode 场景下效果相同

### 4.4 验证符号链接

```powershell
# 查看链接
dir "C:\Users\JsonCC\.config\opencode" | Select-Object Name, LinkType, Target

# 查看 Skills 列表
Get-ChildItem "C:\Users\JsonCC\.config\opencode\skills" | Select-Object Name
```

预期输出应显示所有 Skills 文件夹名称。

### 4.5 在 OpenCode 中使用

```powershell
cd D:\projects\jcclab
opencode
```

在 OpenCode 中，Skills 会自动被识别。使用示例：

```
# 让 AI 自动选择 Skill
"帮我创建一个 Word 文档"

# 手动指定 Skill
"使用 xlsx skill 处理这个 Excel 文件"

# 使用 find-skills 发现新 Skills
"有什么 Skill 可以帮我做 PPT？"
```

* * *

## 五、添加新 Skills

### 5.1 从 GitHub 克隆整个仓库

```powershell
cd D:\projects\skills
git clone https://github.com/vercel-labs/skills.git temp
Move-Item temp\skills\* .
Remove-Item temp -Recurse -Force
```

### 5.2 使用 npx skills 安装单个 Skill

```powershell
npx skills add vercel-labs/skills --skill find-skills --copy
# 然后手动移动到 D:\projects\skills\
```

### 5.3 直接下载单个 Skill 文件夹

```powershell
cd D:\projects\skills
git clone --depth 1 https://github.com/vercel-labs/skills.git temp
Move-Item temp\skills\find-skills .
Remove-Item temp -Recurse -Force
```

**⚠️ 注意：** 新 Skill 添加后无需重启 OpenCode，下次会话自动可用。

* * *

## 六、常见问题排查

### 6.1 符号链接创建失败

| 错误 | 原因 | 解决 |
| --- | --- | --- |
| 权限不足 | 需要管理员权限 | 以管理员身份运行 PowerShell |
| 目录已存在 | 目标文件夹已存在 | 先删除现有文件夹 |
| 路径无效 | 源路径不存在 | 确认 D:\\projects\\skills 存在 |

### 6.2 Skills 未被 OpenCode 发现

```powershell
# 检查符号链接
dir "C:\Users\JsonCC\.config\opencode"

# 检查 SKILL.md 格式
Get-ChildItem "D:\projects\skills" -Recurse -Filter SKILL.md

# 验证 frontmatter
# 每个 SKILL.md 必须有 name 和 description
```

### 6.3 Skill 名称格式错误

Skill 名称必须符合以下规则：

-   1-64 个字符
-   小写字母、数字、连字符
-   不能以连字符开头或结尾
-   不能有连续连字符（`--`）

```
✅ 正确：find-skills, frontend-design, xlsx
❌ 错误：Find-Skills, frontend_design, -invalid-, in--valid
```

* * *

## 七、多设备同步配置

### 7.1 场景：家里 + 公司两台电脑

| 内容 | 同步方式 |
| --- | --- |
| Skills 源目录 | Git 仓库或网盘同步 |
| 符号链接 | 每台电脑单独创建 |
| OpenCode 配置 | 手动复制或同步 `opencode.json` |

### 7.2 使用 Git 管理 Skills

```powershell
cd D:\projects\skills
git init
git add .
git commit -m "Initial skills"
# 推送到私有仓库
git remote add origin git@github.com:your-username/opencode-skills.git
git push -u origin main
```

另一台电脑：

```powershell
git clone git@github.com:your-username/opencode-skills.git D:\projects\skills
cmd /c "mklink /J C:\Users\YourName\.config\opencode\skills D:\projects\skills"
```

* * *

## 八、Skills 使用示例

**💡 重要：**使用 Skills 时**不需要**手动指定"使用 xx skill"。你只需要描述任务，OpenCode 会自动匹配并加载合适的 Skill。

### 8.1 文档处理

```
# 创建 Word 文档
"帮我创建一个项目周报文档"

# 处理 PDF
"提取这个 PDF 的表单字段"

# 创建 Excel 报表
"分析这个 CSV 并生成图表"
```

### 8.2 前端开发

```
# 创建 UI 组件
"帮我创建一个登录页面"

# 生成算法艺术
"做一个粒子动画效果"

# 应用主题
"给这个页面添加现代简约主题"
```

### 8.3 开发工具

```
# 构建 MCP 服务器
"创建一个天气 API 集成"

# 测试 Web 应用
"测试这个表单的交互功能"
```

### 8.4 发现新 Skills

如果你想主动查找或安装新 Skills，可以使用 `find-skills`：

```
# 询问有什么 Skill 可用
"有什么 Skill 可以帮我做 PPT？"
"找一个能处理 Excel 的 Skill"

# 或直接使用 npx skills 命令
npx skills find ppt
npx skills add vercel-labs/skills --skill pptx
```

### 8.5 工作原理

```
你描述任务
    ↓
OpenCode 扫描可用的 Skills（通过 skill 工具）
    ↓
AI 根据任务描述匹配最合适的 Skill
    ↓
自动调用 skill({ name: "xxx" }) 加载 Skill 内容
    ↓
按照 Skill 内的指令执行任务
```

**⚠️ 注意：**只有当任务描述与某个 Skill 的 `description` 匹配时，该 Skill 才会被加载。如果 AI 没有使用你期望的 Skill，可以尝试更明确地描述任务场景。

* * *

## 九、参考资源

### 9.1 官方文档

| 资源 | 地址 |
| --- | --- |
| OpenCode Skills 文档 | [https://opencode.ai/docs/skills](https://opencode.ai/docs/skills) |
| OpenCode 配置文档 | [https://opencode.ai/docs/config](https://opencode.ai/docs/config) |

### 9.2 Skills 资源网站

| 网站 | 说明 | 地址 |
| --- | --- | --- |
| **Skills.sh** | Vercel 官方的 Skills 目录，提供 Skills 搜索、安装、排行榜功能 | [https://www.skills.sh/](https://www.skills.sh/) |
| **GitHub 搜索** | 在 GitHub 上直接搜索关键字 `skills`，发现社区和官方的 Skills 仓库 | [github.com/search?q=skills](https://github.com/search?q=skills&type=repositories) |

### 9.3 官方 Skills 仓库

| 仓库 | 说明 | 地址 |
| --- | --- | --- |
| Anthropic Skills | Anthropic 官方 Skills（17 个基础技能） | [github.com/anthropics/skills](https://github.com/anthropics/skills) |
| Vercel Skills | Vercel Labs Skills（含 find-skills 等工具技能） | [github.com/vercel-labs/skills](https://github.com/vercel-labs/skills) |

* * *

**📝 文档版本：**v1.0
**📅 最后更新：**2026 年 5 月 25 日
**💻 适用平台：**Windows 10/11 + PowerShell 5.1+
