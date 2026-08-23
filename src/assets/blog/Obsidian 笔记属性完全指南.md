---
title: Obsidian 笔记属性完全指南
tags:
  - Obsidian
  - 属性
  - frontmatter
  - 教程
---

# Obsidian 笔记属性完全指南

> 笔记属性（Properties）是 Obsidian 在 1.4 版本引入的元数据系统，让你可以用结构化的方式管理笔记的附加信息。它取代了以前的 YAML frontmatter 手动编辑方式，让元数据管理更直观、更规范。

## 一、什么是笔记属性

笔记属性就是笔记最顶部 `---` 之间的 YAML 格式数据，也叫 **frontmatter**。它的作用是给笔记打上「元数据标签」——不是笔记正文，而是关于笔记本身的信息。

```
---
title: 这篇笔记的标题
tags: 学习, 编程
date: 2026-08-24
---

# 正文从这里开始
```

Obsidian 会自动识别这部分内容，在界面上显示为一个专门的「属性面板」，你不需要手动写 YAML 语法。

## 二、如何添加属性

### 方式 1：属性面板（推荐，GUI 操作）

1. 打开任意笔记
2. 点击笔记正文上方的「**属性**」按钮（或按 `Ctrl/Cmd + P` 搜索「打开属性」）
3. 点击「**添加属性**」
4. 输入属性名（如 `tags`），回车
5. 输入属性值（如 `学习, 编程`），回车
6. 重复步骤 3-5 继续添加

添加完成后，Obsidian 会自动在笔记顶部生成对应的 YAML frontmatter。

### 方式 2：手动编辑源码

如果你习惯直接写 Markdown，可以在笔记最顶部手动输入：

```yaml
---
title: 我的笔记
tags:
  - 学习
  - 编程
date: 2026-08-24
---
```

保存后，Obsidian 会自动解析并显示在属性面板里。

### 方式 3：使用模板自动填充

如果你有很多笔记都需要相同的属性结构，可以用 **Templater** 或 **核心模板** 插件，创建一个带 frontmatter 的模板，新建笔记时自动填充。

```yaml
---
title: {{title}}
tags: 
date: {{date}}
---
```

## 三、如何删除属性

### 方式 1：属性面板删除

1. 打开笔记，展开属性面板
2. 鼠标悬停到要删除的属性行
3. 点击右侧出现的 **×** 按钮
4. 属性立即删除

### 方式 2：手动编辑源码

直接在 frontmatter 区域删掉对应的行：

```
---
title: 这行留着
tags:          ← 删掉这行和下面的值
  - 标签1
  - 标签2
date: 2026-08-22  ← 这行也删掉
---
```

### 方式 3：批量清空所有属性

选中两个 `---` 之间的全部内容删掉，笔记就变成没有 frontmatter 的普通 Markdown。

**注意**：删除属性不影响笔记正文内容。但删除 `tags` 后，Obsidian 的标签搜索就找不到这篇笔记了。

## 四、属性类型详解

Obsidian 内置支持以下属性类型：

### 1. 文本（Text）

最基础的类型，存储一段文字。

```
title: Obsidian 笔记属性完全指南
author: JsonCC
cssclass: wide-page
```

**常见用途**：标题、作者、别名、CSS 类名

### 2. 多选（Multi-select）

一个属性可以有多个值，用逗号分隔或在 YAML 里用列表形式。

```
tags: 学习, 编程, Obsidian
aliases: 属性指南, frontmatter教程
```

YAML 列表形式：
```yaml
tags:
  - 学习
  - 编程
  - Obsidian
```

**常见用途**：标签、别名、关联标签

### 3. 数字（Number）

只能输入数字，支持小数。

```
rating: 4.5
pagecount: 320
priority: 1
```

**常见用途**：评分、优先级、页数、版本号

### 4. 复选框（Checkbox）

布尔值，true/false。

```
completed: true
published: false
needs-review: true
```

**常见用途**：完成状态、发布状态、是否需要审核

### 5. 日期（Date）

日期选择器，格式为 `YYYY-MM-DD`。

```
date: 2026-08-24
deadline: 2026-09-01
review-date: 2026-12-31
```

**常见用途**：创建日期、截止日期、审核日期

### 6. 时间（DateTime）

日期 + 时间，格式为 `YYYY-MM-DDTHH:mm`。

```
meeting-time: 2026-08-24T14:00
```

**常见用途**：会议时间、定时任务

### 7. 链接（Link）

指向其他笔记的链接，用 `[[笔记名]]` 格式。

```
related: [[Git 分支管理命令大全]]
parent: [[Git 指南合集]]
```

**常见用途**：关联笔记、父级文档

### 8. 别名（Aliases）

Obsidian 特殊属性，用于给笔记设置多个可搜索的名称。

```
aliases: 属性指南, frontmatter教程, 元数据管理
```

设置后，搜索「属性指南」也能找到这篇笔记。

## 五、属性的功能与用法

### 1. 增强搜索

属性值可以被 Obsidian 搜索索引。比如搜索 `tag:Git` 可以找到所有带 Git 标签的笔记。

### 2. Dataview 查询

安装 **Dataview** 插件后，可以用属性做高级查询：

```dataview
TABLE date, tags
FROM "blog"
WHERE contains(tags, "Git")
SORT date DESC
```

这会列出所有带 Git 标签的笔记，并按日期倒序排列。

### 3. 模板变量

在 Templater 模板中，属性可以作为变量：

```yaml
---
title: {{title}}
date: {{date:YYYY-MM-DD}}
tags: {{tags}}
---
```

### 4. 发布控制

结合 **Obsidian Publish** 或 **Digital Garden** 插件，用属性控制笔记是否发布：

```
published: true
```

### 5. 样式定制

通过 `cssclass` 属性给特定笔记应用不同的 CSS 样式：

```
cssclass: wide-page
```

## 六、属性关联与跨文档查找

### 1. 用链接属性建立关系网

```
parent: [[Git 指南合集]]
children:
  - [[Git 代码提交与同步指南]]
  - [[Git 分支管理命令大全]]
related: [[GitHub Tag 版本管理操作文档]]
```

这样形成一个文档树，方便导航。

### 2. 用标签做分类聚合

所有带 `Git` 标签的笔记会自动出现在 Obsidian 左侧边栏的「标签」面板里，点击标签就能看到所有相关笔记。

### 3. 用 Dataview 建立动态索引

```dataview
TABLE file.folder AS 分类, date AS 日期
FROM "blog"
GROUP BY file.folder
```

自动生成一个按文件夹分组的笔记列表。

### 4. 用属性做看板视图

安装 **Kanban** 插件后，可以用属性做任务看板：

```dataview
TASK
WHERE !completed
SORT priority ASC
```

## 七、推荐的第三方插件

### 核心增强类

| 插件 | 功能 | 推荐度 |
|------|------|--------|
| **Dataview** | 用 SQL 风格查询笔记属性，生成动态列表/表格/任务 | ⭐⭐⭐⭐⭐ |
| **Templater** | 高级模板系统，支持在模板中操作属性 | ⭐⭐⭐⭐⭐ |
| **Linter** | 自动格式化 frontmatter（排序、缩进、补全） | ⭐⭐⭐⭐ |

### 属性管理类

| 插件 | 功能 | 推荐度 |
|------|------|--------|
| **MetaEdit** | 批量编辑属性、在笔记间复制属性 | ⭐⭐⭐⭐ |
| **Periodic Notes** | 自动为日记/周记生成带日期属性的模板 | ⭐⭐⭐⭐ |
| **Natural Language Dates** | 用自然语言输入日期（如"下周一"） | ⭐⭐⭐ |

### 可视化类

| 插件 | 功能 | 推荐度 |
|------|------|--------|
| **Kanban** | 把笔记按属性排列成看板 | ⭐⭐⭐⭐ |
| **Calendar** | 日历视图，按日期属性聚合笔记 | ⭐⭐⭐⭐ |
| **Tag Wrangler** | 批量重命名/合并标签 | ⭐⭐⭐ |

### 发布类

| 插件 | 功能 | 推荐度 |
|------|------|--------|
| **Digital Garden** | 一键发布带属性的笔记到 GitHub Pages | ⭐⭐⭐⭐ |
| **Obsidian Publish** | 官方付费发布方案 | ⭐⭐⭐ |

## 八、最佳实践

1. **统一命名规范**：属性名用小写英文 + 连字符（如 `create-date`），避免中英文混用
2. **必填属性**：至少保留 `title` 和 `tags`，这是搜索和分类的基础
3. **不要过度属性化**：一个笔记 3-5 个属性就够了，太多反而增加管理负担
4. **用模板保证一致性**：新笔记用模板创建，确保属性结构统一
5. **定期清理**：用 Dataview 查找没有属性的笔记，补上缺失的元数据

```dataview
TABLE file.folder
FROM "blog"
WHERE !date
```

这条查询可以找出所有没有 `date` 属性的笔记。

---

> 💡 笔记属性是 Obsidian 知识管理的基础。用好属性，你的笔记库会从「一堆文件」变成「一个可查询、可关联、可自动化的知识图谱」。
