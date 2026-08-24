---
title: OpenCode Go 订阅模型全解析
tags:
  - OpenCode
  - 模型
  - 选型
  - AI
---

# OpenCode Go 订阅模型全解析

> 本文档整理 OpenCode Go 订阅包含的所有模型，对比各家能力差异，帮你快速选型。

## 一、模型总览

OpenCode Go 共包含 **30 个模型**，来自 8 家厂商，覆盖文本、代码、视觉、长上下文等场景。

| 厂商 | 模型 | 数量 |
|------|------|------|
| DeepSeek | deepseek-v4-flash / flash-vision-exp / pro | 3 |
| Qwen（阿里） | qwen3.5-plus ~ qwen3.8-max | 5 |
| Kimi（月之暗面） | kimi-k2.5 ~ kimi-k3 | 4 |
| GLM（智谱） | glm-5 ~ glm-5.3 | 4 |
| MiniMax | minimax-m2.5 / m2.7 / m3 | 3 |
| Mimo | mimo-v2-pro / v2.5 / v2.5-pro / v2-omni | 4 |
| 其他 | gpt-5.6-luna / grok-4.5 / hy3 / longcat-2.0 等 | 7 |

## 二、各模型详细对比

### DeepSeek 系列

| 模型 | 类型 | 上下文 | 视觉 | 特点 |
|------|------|--------|------|------|
| deepseek-v4-flash | 文本 | 128K | ❌ | 速度快、性价比高，日常首选 |
| deepseek-v4-flash-vision-exp | 多模态 | 128K | ✅ | 支持图片理解，本订阅唯一可用的视觉模型 |
| deepseek-v4-pro | 文本 | 128K | ❌ | 能力更强，复杂任务推荐 |

### Qwen（通义千问）系列

| 模型 | 类型 | 上下文 | 视觉 | 特点 |
|------|------|--------|------|------|
| qwen3.5-plus | 文本 | 128K | ❌ | 基础版 |
| qwen3.6-plus | 文本 | 128K | ❌ | 升级版 |
| qwen3.7-plus | 文本 | 128K | ❌ | 平衡版 |
| qwen3.7-max | 文本 | 128K | ❌ | 高性能版 |
| qwen3.8-max | 文本 | 128K | ❌ | 最新旗舰 |

### Kimi（月之暗面）系列

| 模型 | 类型 | 上下文 | 视觉 | 特点 |
|------|------|--------|------|------|
| kimi-k2.5 | 文本 | 128K | ❌ | 基础版 |
| kimi-k2.6 | 文本 | 128K | ❌ | 升级版 |
| kimi-k2.7-code | 代码 | 128K | ❌ | 代码专项优化 |
| kimi-k3 | 文本 | **1M** | ❌ | 旗舰，超长上下文 |

### GLM（智谱）系列

| 模型 | 类型 | 上下文 | 视觉 | 特点 |
|------|------|--------|------|------|
| glm-5 | 文本 | 128K | ❌ | 基础版 |
| glm-5.1 | 文本 | 128K | ❌ | 升级版 |
| glm-5.2 | 文本 | 128K | ❌ | 升级版 |
| glm-5.3 | 文本 | 128K | ❌ | 最新版 |

### MiniMax 系列

| 模型 | 类型 | 上下文 | 视觉 | 特点 |
|------|------|--------|------|------|
| minimax-m2.5 | 文本 | 128K | ❌ | 基础版 |
| minimax-m2.7 | 文本 | 128K | ❌ | 升级版（测试时 500 错误） |
| minimax-m3 | 文本 | 128K | ❌ | 旗舰版 |

### Mimo 系列

| 模型 | 类型 | 上下文 | 视觉 | 特点 |
|------|------|--------|------|------|
| mimo-v2-pro | 文本 | 128K | ❌ | Pro 版（测试时 400 错误） |
| mimo-v2.5 | 文本 | 128K | ❌ | 稳定可用 |
| mimo-v2.5-pro | 文本 | 128K | ❌ | Pro 增强版 |
| mimo-v2-omni | 文本 | 128K | ❌ | 理论支持多模态，但未接入 |

### 其他模型

| 模型 | 厂商 | 状态 | 备注 |
|------|------|------|------|
| gpt-5.6-luna | OpenAI | ❌ 500 错误 | 接口不稳定 |
| grok-4.5 | xAI | ❌ 503 错误 | 服务不可用 |
| hy3 | 未知 | ✅ 可用 | 状态未知 |
| hy3-preview | 未知 | ❌ 400 错误 | 预览版不稳定 |
| longcat-2.0 | 未知 | ✅ 可用 | 状态未知 |
| ox-alpha-free | 未知 | ❌ 503 错误 | 服务不可用 |
| qwen3.8-plus | 阿里 | ❌ 401 错误 | 未授权 |

## 三、场景选型指南

### 日常对话/文档写作
**推荐**：`deepseek-v4-flash` 或 `mimo-v2.5`
- 速度快、中文好、性价比高

### 代码开发/调试
**推荐**：`kimi-k2.7-code` 或 `deepseek-v4-pro`
- 代码专项优化，理解能力强

### 图片识别/视觉任务
**推荐**：`deepseek-v4-flash-vision-exp`
- 本订阅唯一可用的视觉模型

### 长文档/大上下文
**推荐**：`kimi-k3`（1M 上下文）
- 适合处理超长文本、大型代码库

### 复杂推理/分析
**推荐**：`deepseek-v4-pro` 或 `qwen3.7-max`
- 推理能力最强

## 四、稳定性排名（实测）

| 状态 | 模型 |
|------|------|
| ✅ 稳定可用 | deepseek-v4-flash, deepseek-v4-flash-vision-exp, deepseek-v4-pro, mimo-v2.5, mimo-v2.5-pro, qwen3.7-max, qwen3.7-plus, qwen3.6-plus, kimi-k3, kimi-k2.5, kimi-k2.6, kimi-k2.7-code, glm-5/5.1/5.2/5.3, minimax-m2.5, minimax-m3, hy3, longcat-2.0 |
| ❌ 不稳定/不可用 | mimo-v2-omni, mimo-v2-pro, minimax-m2.7, gpt-5.6-luna, grok-4.5, hy3-preview, ox-alpha-free, qwen3.5-plus, qwen3.8-plus |

## 五、注意事项

1. **模型名称必须裸名**：如 `deepseek-v4-flash`，不能写 `deepseek/deepseek-v4-flash`
2. **共享配额**：所有模型共用同一个订阅配额，高频使用需注意额度
3. **视觉模型限制**：vision-exp 会消耗更多 token（思考过程占额外额度）
4. **长上下文模型**：kimi-k3 的 1M 上下文适合特殊场景，日常任务用 128K 足够
5. **不稳定模型**：标记为 ❌ 的模型建议暂时不用，等服务稳定后再试
