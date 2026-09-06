---
title: GPT 模型家族选型总览：GPT-6、GPT-5.6、GPT-5.5 与 GPT-5.4
date: 2026-09-06T00:00:00.000Z
tags:
  - OpenAI
  - Codex Plus
  - 模型选型
category: ai-agent
aliases:
  - GPT 模型选型总览
  - GPT-6 GPT-5.6 模型对比
---

# GPT 模型家族选型总览：GPT-6、GPT-5.6、GPT-5.5 与 GPT-5.4

> 本文是入口文章，重点帮助 Codex Plus 用户理解不同代际；具体操作与用量说明见各专题。

## 一句话划分

```text
GPT-6       前沿旗舰：追求最高能力，适合高难度和长流程任务
GPT-5.6     当前主力：Sol、Terra、Luna 覆盖旗舰、平衡和低成本场景
GPT-5.5/5.4 上一代主力：成熟、仍有价值，适合兼容旧工作流和特定子任务
```

## 怎么选

| 需求 | 优先考虑 |
|---|---|
| 最难的架构、研究、长期 Agent 任务 | GPT-6 |
| 日常 Codex 编程和多文件修改 | GPT-5.6 Terra |
| 疑难 Bug、大型重构 | GPT-5.6 Sol 或 GPT-6 |
| 明确的小修改、测试、批量执行 | GPT-5.6 Luna |
| 子 Agent、截图理解、高并发任务 | GPT-5.4 Mini |
| 仍在使用旧项目或旧提示词 | GPT-5.5 / GPT-5.4 |

## 三个专题

- [[GPT-6 Astra GPT-6 Pro 使用指南：前沿模型能力、限制与适用场景]]
- [[GPT-5.6 系列在 Codex Plus 中怎么选：Sol、Terra、Luna、推理档位与 Fast mode]]
- [[GPT-5.5 与 GPT-5.4 Mini 还值得用吗：上一代主力模型的能力、速度与选型]]

## Codex Plus 用户要注意

Codex Plus 不是按 API 表格中的美元/百万 Token直接向用户逐次扣费。Codex 使用计划内用量；任务复杂度、输入输出长度、模型、推理档位和 Fast mode 都会影响额度消耗。具体额度和重置时间以 Codex 界面显示为准。

`轻度～极高`是推理力度；`1.5x speed` 是 Fast mode，优先速度但会更快消耗用量。两者不是模型版本，也不是“智能倍数”。
