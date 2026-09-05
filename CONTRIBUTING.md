# jcclab 贡献指南

## 博客文章分类

`src/assets/blog/` 下的每篇 Markdown 必须在 frontmatter 中声明 `category`。构建阶段会校验该字段，缺失、拼写错误或 frontmatter 无法解析都会使构建失败。

```yaml
---
title: 文章标题
category: ai-agent
tags:
  - 示例
---
```

可用分类：

- `ai-agent`：AI 与 Agent
- `code-collaboration`：代码协作
- `dev-environment`：开发环境与效率工具
- `site-engineering`：站点工程与自动化

## Commit message 规范

提交信息采用 Conventional Commits 风格。第一行是必填项，正文和附加区块按需填写。

```text
<type>(<scope>): <简洁摘要>

[详细说明]

[可选区块]
```

### 第一行

第一行必须包含类型、作用域和简洁摘要：

```text
feat(博客): 增加文章同步脚本
fix(搜索): 修复搜索结果跳转失败
docs(博客): 补充部署说明
```

- `type`、`scope` 使用英文，摘要使用中文或项目约定的语言。
- 摘要应简洁、以动词开头，不以句号结尾。
- `scope` 应描述受影响的功能模块。当前项目常用作用域包括 `博客`、`搜索`、`工具`。

### 正文

正文是可选的，用于说明背景、问题和主要改动。

- 只有一条说明时，可以直接写一段文字。
- 说明超过一条时，使用 `1.`、`2.`、`3.` 等编号。
- 每一项只描述一个独立的背景、问题或改动。

```text
fix(博客): 修复文章路由解析问题

1. 优先匹配包含连字符的原始文件名。
2. 兼容旧链接中连字符替换为空格的情况。
3. 避免文件名中的连字符被错误转换。
```

### 可选区块

根据实际情况，可以在正文后增加以下区块：

```text
测试：
- npm run typecheck
- npm run build

兼容性：
- 保留旧链接解析逻辑。

BREAKING CHANGE：
- 调整 API 返回结构，旧客户端需要升级。

关联：
- #123
```

`BREAKING CHANGE` 用于记录不兼容的行为变化，关联区块用于填写 Issue、PR 或其他相关链接。

### 类型

项目允许使用以下类型：

| 类型 | 用途 |
| --- | --- |
| `feat` | 新增功能 |
| `fix` | 修复问题 |
| `docs` | 修改文档或博客内容 |
| `refactor` | 重构，不改变外部行为 |
| `perf` | 性能优化 |
| `test` | 添加或修改测试 |
| `build` | 构建系统或依赖变更 |
| `ci` | CI/CD 配置变更 |
| `chore` | 其他维护性工作 |
| `sync` | 内容或数据同步 |
| `revert` | 回滚已有提交 |

### 完整示例

```text
feat(博客): 增加 Obsidian 博客同步脚本

1. 新增博客同步脚本，支持将 Obsidian 内容同步到项目。
2. 增加 dry-run 模式，用于预览同步结果。
3. 增加对应的 npm 命令，统一同步操作入口。

测试：
- npm run typecheck
- npm run build

兼容性：
- 不影响现有博客文章和访问链接。
```
