---
category: ai-agent
title: opencode Skills 完整使用指南
tags:
  - OpenCode
  - Skills
  - 指南
---
# opencode Skills 完整使用指南

## 什么是 Skills

Skills 是 opencode 的能力插件系统。每个 skill 通过 `SKILL.md` 文件定义，包含 YAML front matter（名称、描述）和 Markdown 指令内容。当对话内容与 skill 的描述匹配时，agent 自动加载并按照 skill 中的指令执行任务。

本机共安装 **40 个 skills**，来源分为两部分：

- **原生 opencode skills（18 个）** — 覆盖设计、文档、开发、测试等通用场景
- **Matt Pocock skills（22 个）** — 来自 [github.com/mattpocock/skills](https://github.com/mattpocock/skills)，聚焦工程实践（TDD、代码审查、领域建模等）

### 两种触发方式

| 方式 | 说明 | 示例 |
|---|---|---|
| **手动触发** | 在对话中输入 `/skill-name` 或 `skill-name` 主动调用 | `/grill-me`、`/tdd` |
| **自动匹配** | 通过描述语义自动匹配，无需用户指定 | 说"帮我排查这个 bug"自动触发 `diagnosing-bugs` |

Skill 被激活时，响应开头会显示 `[skill-name]` 标记，方便你知晓当前使用的是哪个 skill。

---

## Skills 速查表

| 名称 | 触发 | 分类 | 功能一句话 |
|---|---|---|---|
| `algorithmic-art` | 自动 | 设计 & 视觉 | 生成 p5.js 算法艺术 |
| `ask-matt` | `/ask-matt` | 拷问 & 领域建模 | 询问该用哪个 skill |
| `brand-guidelines` | 自动 | 设计 & 视觉 | 应用品牌色和字体规范 |
| `canvas-design` | 自动 | 设计 & 视觉 | 创建视觉设计（PNG/PDF） |
| `claude-api` | 自动 | 开发 & API | 构建 Claude API / SDK 应用 |
| `code-review` | `/code-review` | 代码审查 & 架构 | 双轴代码审查（规范 + 需求符合度） |
| `codebase-design` | `/codebase-design` | 代码审查 & 架构 | 设计深度模块接口 |
| `diagnosing-bugs` | `/diagnosing-bugs` | 测试 & 调试 | 结构化 Bug 排查流程 |
| `doc-coauthoring` | 自动 | 文档 & 办公 | 协作撰写文档 |
| `docx` | 自动 | 文档 & 办公 | 创建/编辑 Word 文档 |
| `domain-modeling` | `/domain-modeling` | 拷问 & 领域建模 | 构建/打磨领域模型 |
| `find-skills` | 自动 | 开发 & API | 发现并安装其他技能 |
| `frontend-design` | 自动 | 设计 & 视觉 | 构建高水准前端界面 |
| `grill-me` | `/grill-me` | 拷问 & 领域建模 | 方案拷问面试 |
| `grill-with-docs` | `/grill-with-docs` | 拷问 & 领域建模 | 拷问 + 领域文档化 |
| `grilling` | `/grilling` | 拷问 & 领域建模 | 拷问循环引擎（被其他 skill 调用） |
| `handoff` | `/handoff` | 效率 & 协作 | 生成交接文档给其他 agent |
| `implement` | `/implement` | 需求 & 规划 | 按 Spec/工单实现功能 |
| `improve-codebase-architecture` | `/improve-codebase-architecture` | 代码审查 & 架构 | 扫描架构并生成改进报告 |
| `internal-comms` | 自动 | 文档 & 办公 | 撰写内部沟通文案 |
| `mcp-builder` | 自动 | 开发 & API | 构建 MCP 协议服务器 |
| `pdf` | 自动 | 文档 & 办公 | 处理 PDF 文件（读取/合并/拆分/OCR） |
| `pptx` | `pptx` | 文档 & 办公 | 创建/编辑 PPT 演示文稿 |
| `prototype` | `/prototype` | 效率 & 协作 | 构建一次性原型验证设计 |
| `research` | `/research` | 效率 & 协作 | 调查问题并输出带引用的 Markdown |
| `resolving-merge-conflicts` | `/resolving-merge-conflicts` | 测试 & 调试 | 解决 Git 合并冲突 |
| `setup-matt-pocock-skills` | `/setup-matt-pocock-skills` | 效率 & 协作 | 首次项目配置向导 |
| `skill-creator` | 自动 | 效率 & 协作 | 创建/优化自定义 skill |
| `slack-gif-creator` | 自动 | 设计 & 视觉 | 创建 Slack 动图 |
| `tdd` | `/tdd` | 测试 & 调试 | 红-绿-重构 TDD 循环 |
| `teach` | `/teach` | 效率 & 协作 | 技能教学（多会话） |
| `theme-factory` | 自动 | 设计 & 视觉 | 为内容提供配色和字体主题 |
| `to-spec` | `/to-spec` | 需求 & 规划 | 对话转 Spec 文档 |
| `to-tickets` | `/to-tickets` | 需求 & 规划 | 方案拆解为工单 |
| `triage` | `/triage` | 效率 & 协作 | 议题三态流转管理 |
| `wayfinder` | `/wayfinder` | 需求 & 规划 | 超大任务规划导航 |
| `webapp-testing` | 自动 | 测试 & 调试 | Playwright Web 应用测试 |
| `web-artifacts-builder` | 自动 | 设计 & 视觉 | 构建多组件 HTML 作品 |
| `writing-great-skills` | `/writing-great-skills` | 文档 & 办公 | 编写/优化 skill 的参考指南 |
| `xlsx` | 自动 | 文档 & 办公 | 处理 Excel 电子表格 |

---

## 详解

### 3.1 设计 & 视觉类

| Skill | 触发方式 | 说明 |
|---|---|---|
| `algorithmic-art` | 自动 | 生成 p5.js 算法艺术。支持种子随机数和交互式参数探索。用户提及"算法艺术"、"生成艺术"、"粒子系统"等时自动触发。 |
| `brand-guidelines` | 自动 | 应用 Anthropic 官方品牌色和字体规范到作品中。用户提及品牌色、视觉格式化、公司设计标准时自动触发。 |
| `canvas-design` | 自动 | 创建视觉设计作品（.png 或 .pdf）。先生成设计哲学，再将其视觉化表达。用户要求制作海报、艺术作品、设计时自动触发。 |
| `frontend-design` | 自动 | 构建具有高设计质量的前端界面，避免 AI 生成式的通用美学。支持 React 组件、HTML/CSS 布局、落地页等。 |
| `slack-gif-creator` | 自动 | 创建适合 Slack 的动画 GIF。提供约束条件、验证工具和动画概念。用户请求"做一个 GIF"时触发。 |
| `theme-factory` | 自动 | 提供 10 套预设配色/字体主题，应用于幻灯片、文档、HTML 页面等各种内容。也可以现场生成新主题。 |
| `web-artifacts-builder` | 自动 | 使用 React、Tailwind CSS、shadcn/ui 构建多组件的 HTML 作品。适用于需要状态管理、路由的复杂作品。 |

```markdown
# 使用示例
用户: "帮我设计一个科技感的着陆页"
→ 自动匹配 frontend-design

用户: "做一个极简风格的海报，PDF 格式"
→ 自动匹配 canvas-design
```

### 3.2 文档 & 办公类

| Skill | 触发方式 | 说明 |
|---|---|---|
| `doc-coauthoring` | 自动 | 结构化协作撰写文档：上下文收集 → 迭代精炼 → 读者验证三步流程。用户提及"写文档"、"提案"、"技术规格"时触发。 |
| `docx` | 自动 | 创建、读取、编辑 Word 文档（.docx）。支持表格、图片、页眉页脚、跟踪修订、批注等。用户提及"Word 文档"、"报告"、"信函"时触发。 |
| `internal-comms` | 自动 | 撰写各种内部沟通文案：状态报告、领导层更新、3P 更新、公司通讯、FAQ、事故报告、项目更新等。 |
| `pdf` | 自动 | 处理 PDF 文件：读取/提取文本和表格、合并/拆分、旋转页面、加水印、创建新 PDF、OCR 扫描件等。 |
| `pptx` | 自动 | 创建、编辑 PPT 演示文稿。支持幻灯片创建、模板应用、布局调整、演讲者备注、评论等。用户提及"幻灯片"、"演示"、"deck"时触发。 |
| `writing-great-skills` | `/writing-great-skills` | 编写和编辑 skill 的参考指南——使 skill 具备可预测性的词汇和原则。 |
| `xlsx` | 自动 | 处理 Excel 电子表格（.xlsx / .xlsm / .csv / .tsv）：读取、编辑、公式计算、格式化、图表、数据清洗等。 |

```markdown
# 使用示例
用户: "帮我把这份报告转成 Word 文档"
→ 自动匹配 docx

用户: "把这个表格数据做成 Excel，带图表"
→ 自动匹配 xlsx

用户: "把这几页 PDF 合并成一个文件"
→ 自动匹配 pdf
```

### 3.3 开发 & API 类

| Skill | 触发方式 | 说明 |
|---|---|---|
| `claude-api` | 自动 | 构建 Claude API / Anthropic SDK 应用。支持提示缓存、思考、工具使用、批量处理等特性。代码中出现 `anthropic` / `@anthropic-ai/sdk` 导入时自动触发。 |
| `mcp-builder` | 自动 | 构建 MCP（Model Context Protocol）服务器。支持 TypeScript（推荐）和 Python。提供端到端指导：研究规划 → 实现 → 测试 → 评审。 |
| `find-skills` | 自动 | 帮助用户发现和安装社区 skills。会查询 skills.sh 排行榜并推荐合适的 skill。用户说"帮我找一个做 X 的 skill"时触发。 |

```markdown
# 使用示例
用户: "帮我用 Python 写一个调用 Claude API 的例子"
→ 自动匹配 claude-api

用户: "我想建一个 MCP 服务器来查询 GitHub API"
→ 自动匹配 mcp-builder

用户: "有没有做前端设计的 skill？"
→ 自动匹配 find-skills
```

### 3.4 测试 & 调试类

| Skill | 触发方式 | 说明 |
|---|---|---|
| `diagnosing-bugs` | `/diagnosing-bugs` + 自动 | 结构化 Bug 诊断流程：复现 → 最小化 → 假设 → 检测 → 修复 → 回归测试。用户说"排查这个 bug"、"调试"时触发。 |
| `resolving-merge-conflicts` | `/resolving-merge-conflicts` + 自动 | 逐块解决 Git 合并/变基冲突。理解双方的意图后逐段解决，从不 `--abort`。用户说"有合并冲突"时触发。 |
| `tdd` | `/tdd` + 自动 | 测试驱动开发：红（写失败测试）→ 绿（通过测试）→ 重构循环。用户说"写测试"、"红绿重构"时触发。 |
| `webapp-testing` | 自动 | 使用 Playwright 测试本地 Web 应用。支持功能验证、UI 行为调试、截图、查看浏览器日志。 |

```markdown
# 使用示例
用户: "帮我排查这个接口返回数据不对的问题"
→ 自动匹配 diagnosing-bugs

用户: "用 TDD 实现这个函数"
→ /tdd 或自动匹配

用户: "这个页面有个 bug，点按钮没反应"
→ 自动匹配 diagnosing-bugs
```

### 3.5 代码审查 & 架构类

| Skill | 触发方式 | 说明 |
|---|---|---|
| `code-review` | `/code-review` + 自动 | 双轴代码审查：Standards（是否符合代码规范 + Fowler 代码坏味基线）和 Spec（是否忠实实现需求）。并行运行两个子 agent 分别审查。 |
| `codebase-design` | `/codebase-design` + 自动 | 设计深度模块（Deep Module）：小接口背后封装大量行为，放在干净的接缝处，通过接口可测试。 |
| `improve-codebase-architecture` | `/improve-codebase-architecture` | 扫描整个代码库，识别架构摩擦点，生成可视化的 HTML 改进报告，然后逐个拷问你选择的改进机会。 |

```markdown
# 使用示例
用户: "帮我 review 一下这个 PR 的改动"
→ /code-review 或自动匹配

用户: "这个模块接口太复杂了，怎么改进？"
→ /codebase-design 或自动匹配

用户: "代码库越来越难改了，帮我看看架构"
→ /improve-codebase-architecture
```

### 3.6 需求 & 规划类

> 这组 skill 构成完整的议题驱动开发工作流：对话 → Spec → Tickets → Implement → Review。
> 部分 skill（`to-spec`、`to-tickets`、`triage`、`wayfinder`）依赖外部议题追踪器（GitHub Issues / Linear），首次使用前运行 `/setup-matt-pocock-skills` 配置。

| Skill | 触发方式 | 说明 |
|---|---|---|
| `implement` | `/implement` | 按 Spec 或工单描述实现功能。驱动 `/tdd` 在预先商定的接缝处编写测试，完成后自动调用 `/code-review` 审查。 |
| `to-spec` | `/to-spec` | 将当前对话内容直接合成 Spec（PRD）文档并发布到议题追踪器。不采访用户——只综合已讨论过的内容。 |
| `to-tickets` | `/to-tickets` | 将方案、Spec 或对话拆解为一组 tracer-bullet 工单，每张票注明其阻塞依赖关系。 |
| `wayfinder` | `/wayfinder` | 规划超大任务（超过一个 agent 会话能容纳的体量）。在议题追踪器上创建"决策票"地图，逐个解决直到路径清晰。 |

```markdown
# 使用示例
用户: "把刚才讨论的方案转成 spec"
→ /to-spec

用户: "把这个 spec 拆成具体的开发任务"
→ /to-tickets

用户: "按这个 spec 开始实现"
→ /implement
```

### 3.7 拷问 & 领域建模类

> 这是 Matt Pocock 最受欢迎的 skill 类别，核心是"拷问引擎" `grilling`，被 `grill-me` 和 `grill-with-docs` 调用。

| Skill | 触发方式 | 说明 |
|---|---|---|
| `ask-matt` | `/ask-matt` | 路由 skill——当你不知道该用哪个 skill 时，询问它。它会根据你的需求推荐合适的 skill 或工作流程。 |
| `domain-modeling` | `/domain-modeling` + 自动 | 主动构建和打磨项目领域模型：挑战术语、设计边界场景、更新 CONTEXT.md（术语表）和 ADRs（架构决策记录）。 |
| `grill-me` | `/grill-me` | 基础拷问。逐条追问你的方案，等待回答后再继续，直到所有决策分支都被遍历。适合快速方案对齐。 |
| `grill-with-docs` | `/grill-with-docs` | 拷问升级版。在拷问的同时构建领域模型、打磨术语、记录架构决策到 ADR 和 CONTEXT.md。适合领域驱动设计。 |
| `grilling` | `/grilling` | 拷问循环引擎——`grill-me` 和 `grill-with-docs` 底层的核心循环。一般不需要直接调用，会被其他 skill 自动使用。 |

```markdown
# 使用示例
用户: "我想在支付模块加一个新功能，帮我分析一下"
→ /grill-me（它会追问：涉及哪些实体？边界条件？错误处理？）

用户: "帮我设计订单系统的领域模型"
→ /domain-modeling（它会挑战术语、创建场景、输出模型）

用户: "我要重构用户模块，帮我先梳理一下"
→ /grill-with-docs（拷问 + 同步更新术语和 ADR）
```

### 3.8 效率 & 协作类

| Skill | 触发方式 | 说明 |
|---|---|---|
| `handoff` | `/handoff` | 将当前对话压缩为交接文档，保存到 OS 临时目录，让另一个 agent 可以继续工作。包含"建议使用的 skills"章节。 |
| `prototype` | `/prototype` + 自动 | 构建一次性原型来回答设计问题：终端应用测试状态/逻辑，或 UI 原型展示多种设计方案。 |
| `research` | `/research` + 自动 | 在后台启动一个子 agent 调查问题，你继续当前工作。输出带引用的 Markdown 文件。 |
| `setup-matt-pocock-skills` | `/setup-matt-pocock-skills` | 在每个项目上首次运行一次。配置议题追踪器（GitHub / Linear / 本地文件）、triage 标签、文档保存位置。 |
| `skill-creator` | 自动 | 创建、编辑、优化自定义 skill。支持运行评测（eval）测试 skill 性能。用户说"帮我创建一个 skill"时触发。 |
| `teach` | `/teach` | 多会话教学。在当前目录下创建教学工作区，分多次会话教授用户新技能或概念。 |
| `triage` | `/triage` | 议题三态流转：分类 → 验证 → 处理。支持 GitHub Issues 和 Linear。也覆盖外部 PR 的 triage。 |

```markdown
# 使用示例
用户: "这个对话太长了，下次继续。帮我做个交接文档"
→ /handoff

用户: "先搭个原型验证一下这个交互方案"
→ /prototype 或自动匹配

用户: "调查一下 Rust 的 async 最佳实践"
→ /research 或自动匹配
```

---

## 如何判断 Skill 是否生效

每个 skill 的 SKILL.md 中都包含了一行身份宣告：

```markdown
> **SKILL_IDENTITY**: `skill-name`
```

当 agent 激活某个 skill 时，会在响应开头显示这个标记：

```
[diagnosing-bugs] 好的，让我按照诊断流程来排查这个问题。
步骤 1：复现问题...
```

如果你没有看到 `[skill-name]` 标记，说明 agent 没有匹配到合适的 skill——可以尝试手动输入 `/skill-name` 来触发。

---

## 最佳实践建议

### 1. 不知道怎么开始？用 `/ask-matt`

```
/ask-matt
```

它会根据你的描述推荐合适的 skill。

### 2. 复杂任务先拷问

在开始实现之前，先用 `/grill-me` 让 agent 系统地质询你的方案。这能大幅减少"做出来的不是我想要的"的情况。

### 3. 用 TDD + 代码审查保证质量

```
/tdd      → 先写测试再写实现
/code-review → 审查改动是否符合规范和需求
```

### 4. 领域模型是长期投资

在项目初期运行一次 `/domain-modeling` 建立统一语言，之后每次迭代前用 `/grill-with-docs` 同步更新。长期来看能显著减少 agent 的 token 消耗和沟通成本。

### 5. 关注 `[skill-name]` 标记

如果发现 agent 没有按预期行为工作（比如该拷问时直接给答案了），检查是否缺少 `[skill-name]` 标记——此时可以手动输入对应的 `/command` 强制触发。

---

## 存储位置

所有 skill 的文件位于 `D:\projects\skills\`，每个 skill 一个子目录，包含 `SKILL.md`（指令文件）和 `SOURCE.txt`（来源记录）。
