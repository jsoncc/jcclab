# OpenCode + OpenRouter + OpenCode Go 完整配置与选型指南

---

## 一、先搞懂三者的关系

很多人会把 **OpenCode**、**OpenRouter**、**OpenCode Go** 混在一起。先用一张图建立直觉：

```text
                    ┌─────────────────────────────────┐
                    │         OpenCode（软件）          │
                    │  终端 AI 编程助手（你装的 opencode）│
                    │  /connect  /models  /init  …     │
                    └───────────────┬─────────────────┘
                                    │
            「模型从哪来」= 选一个 Provider（提供商）
                                    │
        ┌───────────────┬───────────┼───────────┬───────────────┐
        ▼               ▼           ▼           ▼               ▼
   OpenRouter      OpenCode Go   OpenCode Zen   OpenAI      GitHub Copilot
   （第三方平台）    （官方月订）   （官方按量）   （ChatGPT）    …
        │               │           │
        ▼               ▼           ▼
   openrouter.ai    opencode.ai   opencode.ai
```

### 1.1 分别是什么

| 名称 | 是什么 | 谁做的 |
|------|--------|--------|
| **OpenCode** | 终端里的 AI 编程助手（TUI、CLI、可选桌面版） | [anomalyco/opencode](https://github.com/anomalyco/opencode) |
| **OpenRouter** | 独立的 AI API 平台：一个 Key 访问多家模型 | [openrouter.ai](https://openrouter.ai)（**不是** OpenCode 子公司） |
| **OpenCode Go** | OpenCode 官方的低价**月订**套餐，含一批开源/国产向模型 | [opencode.ai](https://opencode.ai) |
| **OpenCode Zen** | OpenCode 官方的**按量充值**网关，模型经官方筛选 | 同上（opencode.ai） |

### 1.2 核心结论（务必记住）

用三种生活类比理解三者关系（**编程**那一行最贴本指南场景）：

| 类比 | OpenCode | OpenRouter | OpenCode Go |
|------|----------|------------|-------------|
| 手机 | 手机系统 + App | 移动/联通之一 | 另一种流量包 |
| 外卖 | 外卖 App | 餐厅 A | 官方月卡套餐 B |
| 编程 | VS Code / Cursor 类 Agent | 一个 API 批发商 | OpenCode 自家便宜月卡 |

- **OpenRouter 和 OpenCode Go 互不隶属**，只是都能在 OpenCode 里通过 `/connect` 接入。
- **订了 Go 不等于有了 OpenRouter**；**连了 OpenRouter 也不用订 Go**。各付各的钱。
- 你给的旧仓库 [opencode-ai/opencode](https://github.com/opencode-ai/opencode) 已归档，请用新版 [anomalyco/opencode](https://github.com/anomalyco/opencode)。

### 1.3 和 Claude Code 的区别

| 名称 | 说明 |
|------|------|
| **Claude Code** | Anthropic **官方**终端编程工具，需 Claude 订阅/API |
| **OpenCode + OpenRouter 上的 Claude** | 第三方工具经 OpenRouter 调用 Claude 模型 |
| **OpenCode + Claude Pro 订阅登录** | 官方**不推荐**在 OpenCode 里蹭 Claude 订阅 |

「不推荐 Claude Code」是误解——我们讨论的是**别在 OpenCode 里绑 Claude 订阅**，不是别用 Claude Code 本身。

---

## 二、安装 OpenCode（Windows）

任选一种方式：

```powershell
# 方式 1：Scoop（推荐）
scoop install opencode

# 方式 2：Chocolatey
choco install opencode

# 方式 3：npm
npm install -g opencode-ai

# 方式 4：官方安装脚本（Git Bash / WSL）
curl -fsSL https://opencode.ai/install | bash
```

验证安装：

```powershell
opencode --version
```

也可从 [GitHub Releases](https://github.com/anomalyco/opencode/releases) 下载桌面版。

### 2.1 配置文件位置（Windows）

| 类型 | 路径 |
|------|------|
| 全局配置 | `%USERPROFILE%\.config\opencode\opencode.json` |
| API 凭证 | `%USERPROFILE%\.local\share\opencode\auth.json` |
| 项目配置 | 项目根目录 `opencode.json`（可提交 Git） |

配置会**多层合并**，后加载的覆盖冲突项。详见 [Config 文档](https://dev.opencode.ai/docs/config/)。

---

## 三、OpenRouter 完整配置

### 3.1 准备 OpenRouter 账号

1. 注册/登录：[https://openrouter.ai/](https://openrouter.ai/)
2. 创建 API Key：[https://openrouter.ai/keys](https://openrouter.ai/keys)（格式一般为 `sk-or-...`）
3. **充值**：进入 [Credits](https://openrouter.ai/settings/credits) 购买额度

#### 充值方式与费用说明

| 项目 | 说明 |
|------|------|
| 计费模式 | **预充值按量**，无包月套餐 |
| 扣费方式 | 按模型标价扣 input/output token |
| 平台费 | 充值时约 **5.5%** 手续费（最低约 $0.80） |
| 模型标价 | OpenRouter **不 markup** 厂商价，与厂商官网一致 |
| 消费查看 | [Activity 仪表盘](https://openrouter.ai/activity) |
| 预算控制 | 可设自动充值或手动充值，自己定月预算 |

> **为什么没有包月？** OpenRouter 定位是开发者 API 聚合，不是 ChatGPT Plus 那种 C 端订阅。

### 3.2 在 OpenCode 里连接 OpenRouter（交互式，推荐）

```powershell
cd D:\projects\jcclab   # 换成你的项目目录
opencode
```

在 TUI 中依次操作：

| 步骤 | 操作 |
|------|------|
| 1 | 输入 `/connect` |
| 2 | 选择 **OpenRouter** |
| 3 | 粘贴 `sk-or-...` API Key |
| 4 | 输入 `/models` 选择模型 |
| 5 | （可选）输入 `/init` 生成 `AGENTS.md` |

#### `/connect` 之后出现模型列表怎么办？

这说明 **OpenRouter 已连接成功**，当前界面是**选模型**，不是报错。

| 按键 | 作用 |
|------|------|
| `↑` / `↓` | 在列表中移动 |
| 输入文字 | 在 Search 中过滤（如 `claude sonnet`、`gemini flash`） |
| `Enter` | 确认选中当前高亮模型 |
| `Esc` | 关闭列表 |
| `Ctrl+F` | 收藏当前模型 |

**不要直接回车**除非你真的要用默认高亮项（如 Aion-1.0）。编程推荐搜：

- `claude sonnet` → Sonnet 4.x / Sonnet Latest
- `gemini 2.5 flash` → 性价比首选
- `deepseek` → 偏代码

**避免使用 Auto Router** 做主力开发——质量不稳定，账单不透明。

### 3.3 配置文件方式（可选）

全局 `%USERPROFILE%\.config\opencode\opencode.json`：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "google/gemini-2.5-flash",
  "enabled_providers": ["openrouter"],
  "provider": {
    "openrouter": {
      "models": {
        "google/gemini-2.5-flash": {},
        "anthropic/claude-sonnet-4": {}
      }
    }
  }
}
```

API Key 建议通过 `/connect` 写入 `auth.json`，**不要明文提交到 Git**。

也可用环境变量：

```powershell
[System.Environment]::SetEnvironmentVariable("OPENROUTER_API_KEY", "sk-or-xxx", "User")
```

### 3.4 OpenRouter 模型定价参考（写代码常用）

价格单位：**每百万 token（$/M）**，**输出通常比输入贵得多**。

| 模型 | 输入 | 输出 | 代码能力档 |
|------|------|------|------------|
| Claude Sonnet 4.x | $3 | $15 | S 档（最强之一） |
| Gemini 2.5 Flash | $0.30 | $2.50 | A- 档（性价比首选） |
| Gemini 2.5 Flash Lite | $0.10 | $0.40 | B+ 档（更省） |
| Auto Router | 不定 | 不定 | C～A 飘（不推荐主力） |

粗算：一次中等会话（50k 输入 + 20k 输出）—— Sonnet 约 **$0.45**，Flash 约 **$0.065**。

---

## 四、OpenCode Go 完整订阅与使用

### 4.1 Go 是什么

| 项目 | 内容 |
|------|------|
| 月费 | 首月约 **$5**，之后 **$10/月** |
| 定位 | 低价月订 + 可靠访问一批开源/国产向编程模型 |
| 模型 | GLM、Kimi、Qwen、DeepSeek、MiniMax、MiMo 等 |
| API 入口 | `https://opencode.ai/zen/go/...` |
| 状态 | 目前为 **Beta** |

### 4.2 订阅步骤（网页端）

#### 步骤 1：打开订阅入口

- [https://opencode.ai/go](https://opencode.ai/go) → 点 **Subscribe to Go**
- 或直接：[https://opencode.ai/auth](https://opencode.ai/auth)

#### 步骤 2：登录账号

在 auth 页面选择：

- **Continue with GitHub**，或
- **Continue with Google**

##### GitHub 与 Google 登录有区别吗？

| 项目 | GitHub | Google |
|------|--------|--------|
| 订 Go / 拿 Key | ✅ 都可以 | ✅ 都可以 |
| 套餐与额度 | **完全相同** | **完全相同** |
| 实际差别 | 选你**更常用、网络更稳**的那个 | 同上 |

**注意事项：**

- 这是 **opencode.ai 官网登录**，不是终端里 `/connect` 的 GitHub Copilot。
- **不要用两个账号各登一次**，可能变成两个独立账户，订阅和余额不互通。
- 订了 Go 的账号，以后续费、看用量要用**同一种方式**登录。

#### 步骤 3：订阅并绑卡

1. 登录后进入 OpenCode Zen / 账户控制台
2. 找到 **OpenCode Go** 订阅（$5 首月 → $10/月）
3. 添加付款方式（国际信用卡等，以结账页为准）
4. 确认订阅状态为 **Active**

> Go 和 Zen 是**不同产品**：Zen 是充值按量；Go 是月订 + 内含额度。

#### 步骤 4：复制 API Key

在控制台创建或查看 **OpenCode Go** 的 API Key 并保存。

### 4.3 在 OpenCode 终端连接 Go

```powershell
cd D:\projects\jcclab
opencode
```

| 步骤 | 操作 |
|------|------|
| 1 | `/connect` |
| 2 | 选择 **OpenCode Go**（不是 Zen、不是 OpenRouter） |
| 3 | 粘贴 Go 的 API Key |
| 4 | `/models` 选模型 |

#### Go 推荐模型（Java / Spring / Vue / React / MySQL）

| 场景 | 推荐模型 |
|------|----------|
| 日常开发、省额度 | **Qwen3.5 Plus**、**DeepSeek V4 Flash** |
| 稍强一点 | **Qwen3.6 Plus**、**DeepSeek V4 Pro** |
| 不建议主力 | Go 免费档、Zen 免费档 |

### 4.4 Go 用量限额（超过会怎样）

Go 月费 $10 内含的是**用量上限**（按美元价值计），不是「再收 $60」：

| 周期 | 上限（约） |
|------|------------|
| 每 5 小时 | $12 |
| 每周 | $30 |
| 每月 | $60 |

**哪个先到先触发。**

#### 超过限额之后

```text
月 $60 用完（或周/5h 限额先到）
    │
    ├─ 默认（未开 Use balance、Zen 无余额）
    │     → Go 付费模型不可用
    │     → 仍可用 Zen 免费模型（能力弱一档）
    │     → 月费 $10 照样收，不会自动再收 $60
    │
    └─ 已开 Use balance 且 Zen 有余额
          → 继续用 Go 模型，从 Zen 余额按量扣费（$10 + 额外充值）
```

限额重置时间以 [opencode.ai 控制台](https://opencode.ai/auth) 用量页为准。

### 4.5 小技巧：模型选择与切换

官网列出的 12 个 Go 模型，是套餐**允许使用的模型池**，不是 12 个模型自动轮着用。实际使用时需要理解下面几点。

#### 有没有 Auto 自动切换？

| 提供商 | 是否有 Auto |
|--------|-------------|
| **OpenRouter** | ✅ 有 **Auto Router**（不推荐当主力） |
| **OpenCode Go** | ❌ **没有** Auto，需手动指定主模型 |

Go 里**同一时间通常只有一个主模型**在跑；左下角会显示当前模型，例如 `Build · Qwen3.5 Plus · OpenCode Go`。

#### 什么情况下会「自动」换模型？

OpenCode 里和模型相关的「自动」只有这些，**都不是按「写 Java / 改 Vue」智能路由**：

| 机制 | 做什么 |
|------|--------|
| **`small_model`** | 会话标题等轻量任务用更便宜模型，主对话仍用你选的主模型 |
| **`compaction.auto`** | 上下文满了自动压缩会话，不换模型 |
| **自定义 agent / command** | 配置里给某个 agent 指定别的模型，只有你主动用时才换 |

**Plan 模式（Tab）和 Build 模式**是行为差异，默认**不换模型**。

#### 手动切换策略（Go 推荐）

| 场景 | 建议模型 | 理由 |
|------|----------|------|
| **日常主力**（Java CRUD、Vue/React、SQL） | **Qwen3.5 Plus** 或 **DeepSeek V4 Flash** | 月额度里请求数最多 |
| **稍难**（多模块、接口设计） | **Qwen3.6 Plus**、**DeepSeek V4 Pro** | 质量更好，更烧额度 |
| **很难**（架构、疑难 bug） | **GLM-5.1**、**Kimi K2.6** | 能力强，额度消耗快 |
| **省额度、简单问答** | **DeepSeek V4 Flash**、**MiniMax M2.5** | 请求数多 |

```text
开始一天开发 → 固定 Qwen3.5 Plus（或 DeepSeek V4 Flash）当主力
遇到难题 / 连续改不对 → /models 临时切 DeepSeek V4 Pro 或 Qwen3.6 Plus
还是搞不定 → 再切 GLM-5.1 / Kimi K2.6
难题解决后 → /models 切回 Qwen3.5 Plus，省额度
```

切换方式：输入 **`/models`** 选新模型，或在 `opencode.json` 里改 `model`。

#### 固定默认模型（少每次手选）

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode-go/qwen3.5-plus",
  "small_model": "opencode-go/deepseek-v4-flash",
  "enabled_providers": ["opencode-go"]
}
```

模型 ID 格式为 `opencode-go/<模型名>`（如 `qwen3.5-plus`、`deepseek-v4-pro`）。

#### OpenRouter 侧的小技巧

- 用 OpenRouter 时同样 **`/models` 固定一个模型**，避免 **Auto Router**。
- Java 全栈日常推荐 **`google/gemini-2.5-flash`**；要质量再切 Sonnet。
- 大需求先 **Plan** 再 **Build**，减少返工烧 token。

### 4.6 说明事项：每个 Workspace 只能一名成员订阅 Go

官网提示：**每个工作空间只能有一名成员订阅 OpenCode Go。** 这句话容易误解，说明如下。

#### Workspace 是什么？

**Workspace（工作空间）** 指 [opencode.ai](https://opencode.ai/auth) 上的**账户/团队空间**，用来管理 Go 订阅、Zen 余额、API Key、成员与用量。

**不是**项目目录、`jcclab` 仓库、Git 仓库，也不是 VS Code 的 Workspace。

#### 具体含义

```text
一个 Workspace（团队账户）
    └── Go 订阅名额：最多 1 个人能「开通/持有」这份 Go 订阅
    └── 不是团队里每个人都可以各订一份 $10/月的 Go
```

#### 常见场景对照

| 场景 | 是否受限 |
|------|----------|
| **一个人，两台电脑**都用 Go | ❌ 不受限（同一 Key 多设备） |
| **一个人**，公司 + 家里电脑，同一 GitHub 账号 | ❌ 不受限 |
| **两个人**共用一个 opencode.ai 团队 Workspace，都想各订 Go | ✅ 受限：只能 1 人订 |
| **两个人**各用各的 GitHub/Google 账号（两个 Workspace） | ❌ 不受限：各订各的 |
| 团队一人订 Go，其他人用他发的 **API Key** | ✅ 可以，**共享同一份 Go 额度** |

#### 个人开发者结论

若你是**个人账号 + 两台电脑**，通常 Workspace 里只有你自己，**可以正常订阅 Go**，这条限制**基本不用管**。只有**公司团队多人想在同一 Workspace 里各自订 Go** 时才需要留意。

---

## 五、OpenCode Zen 简要说明

Zen 是 OpenCode 官方的**按量充值**网关，和 Go 同属 opencode.ai，但计费不同：

| 对比 | Zen | Go |
|------|-----|-----|
| 付费 | 充值按 token | $10/月 + 内含额度 |
| 模型 | 多（含 Claude、GPT、Gemini 等） | 少（开源/国产向） |
| 适合 | 不想挑模型、愿按量 | 月费封顶、预算紧 |

Go 超额后可开 **Use balance** 用 Zen 余额续用。

---

## 六、包月 vs 不包月：费用与能力对比

### 6.1 各方案月费一览

| 方案 | 月费（约） | 是否包月 | 在 OpenCode 连接 |
|------|------------|----------|------------------|
| **OpenCode Go** | $5 首月 → $10/月 | ✅ 是 | `/connect` → OpenCode Go |
| **OpenRouter** | 自定（如 $10～30 充值） | ❌ 按量 | `/connect` → OpenRouter |
| **OpenCode Zen** | 自定充值 | ❌ 按量 | `/connect` → OpenCode Zen |
| **ChatGPT Plus** | $20/月 | ✅ | `/connect` → OpenAI → ChatGPT 登录 |
| **ChatGPT Pro** | $100～200/月 | ✅ | 同上 |
| **Claude Pro** | ~$20/月 | ✅ | 更适合 **Claude Code**，非 OpenCode 首选 |

OpenRouter、Zen **没有包月无限套餐**。

### 6.2 代码能力分档

| 档位 | 代表 | 复杂项目 | 多文件重构 |
|------|------|----------|------------|
| **S** | Sonnet、GPT-5 Codex | 很强 | 很强 |
| **A** | ChatGPT Plus、Gemini Flash | 好 | 较好 |
| **B** | OpenCode Go（Qwen/DeepSeek 等） | 够用 | 中等，易漏改 |
| **C** | 免费模型、Auto Router | 试玩 | 不推荐 |

### 6.3 预算 ≤ $10 怎么选

| 目标 | 推荐 |
|------|------|
| 月费必须固定 | **OpenCode Go（$10/月）** |
| 同样 $10 但要更好代码质量 | **OpenRouter 充 $10 + 固定 Gemini 2.5 Flash**（不包月，可能月中用完） |
| 几乎不花钱 | Zen/OpenRouter 免费模型（质量差一截） |

### 6.4 每天约 4 小时重度使用

**$10/月通常不够**（按量或 Go 额度都可能触顶）。更现实：

| 方案 | 月支出 | 说明 |
|------|--------|------|
| OpenCode Go | $10 | 可能碰周/月限额；质量 B+～A- |
| OpenRouter + Flash | ~$25～45 | 质量 A-，更稳 |
| Go + OpenRouter 备用 | ~$20～25 | 平时 Go，难题切 Flash |

**技术栈（Java Spring + Vue/React + MySQL）** 建议主模型至少 **Gemini 2.5 Flash** 或 Go 里 **Qwen3.5 Plus**，不要用 Lite/免费档扛全天。

---

## 七、国内网络使用注意

### 7.1 OpenRouter

| 项目 | 说明 |
|------|------|
| 访问 | 需稳定访问 `openrouter.ai` |
| 体验 | 依赖代理质量；高峰可能慢、断流 |
| 地区限制 | 部分模型可能报「region not available」，与出口 IP 有关 |

### 7.2 OpenCode Go

官方写明面向**国际用户**，模型部署在 **美国、欧盟、新加坡**。

| 项目 | 说明 |
|------|------|
| 能否使用 | 通常需要稳定国际线路 |
| 常见误区 | Go 含 Qwen/DeepSeek 等「国产模型」，但流量仍先走 `opencode.ai` 境外网关，**不等于国内直连** |
| 对比 | 国内直连 DashScope/DeepSeek 官方 API 通常更快，但那就不是 Go 套餐了 |
| 网络评分 | 国内约 ★★☆～★★★；优势是 $10 包月，不是国内专线 |

### 7.3 实用建议

1. 先浏览器能打开 [opencode.ai](https://opencode.ai) 再订阅 Go
2. 代理选低延迟节点（新加坡/日本/香港常比欧美合适）
3. 固定出口 IP，减少地区报错
4. 两台电脑用**同一套代理策略**

---

## 八、两台电脑共用配置

OpenCode **不限制设备数**；同一 API Key 可在多台电脑使用。

| 内容 | 存放位置 | 同步方式 |
|------|----------|----------|
| API Key | `%USERPROFILE%\.local\share\opencode\auth.json` | 每台 `/connect` 一次，或安全复制（勿提交 Git） |
| 全局习惯 | `%USERPROFILE%\.config\opencode\opencode.json` | 手动复制或网盘同步 |
| 项目配置 | `opencode.json` | **提交 Git**，两台 `git pull` |
| 项目说明 | `AGENTS.md` | 同上 |

项目级 `opencode.json` 示例（可提交 Git，不含密钥）：

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "google/gemini-2.5-flash",
  "enabled_providers": ["openrouter"],
  "shell": "pwsh",
  "instructions": [
    "Java 17+, Spring Boot, Spring MVC/Data/Security",
    "Frontend: Vue and React per package",
    "Database: MySQL"
  ],
  "permission": {
    "bash": "ask",
    "edit": "ask"
  }
}
```

若用 Go，将 `model` 改为如 `opencode-go/qwen3.5-plus`，`enabled_providers` 改为 `["opencode-go"]`。

---

## 九、日常使用速查

### 9.1 常用命令

| 命令/操作 | 作用 |
|-----------|------|
| `/connect` | 连接提供商 |
| `/models` | 切换模型 |
| `/init` | 分析项目，生成 `AGENTS.md` |
| `Tab` | Plan / Build 模式切换 |
| `/undo` / `/redo` | 撤销/重做 AI 改动 |
| `/share` | 分享会话 |
| `opencode run "问题"` | 非交互单次提问 |
| `opencode auth list` | 查看已保存凭证 |
| `opencode debug config` | 查看合并后的最终配置 |

### 9.2 省钱又保质的习惯

- 大需求先 **Plan** 再 **Build**，减少返工烧 token
- 提问带路径：`@src/.../UserService.java`
- 两台机器保持**同一 Git 分支**
- 固定一个主模型，**关掉 Auto Router**（详见 [§4.5 模型切换小技巧](#45-小技巧模型选择与切换)）
- 在 OpenRouter Activity 或 Go 控制台**定期看用量**

---

## 十、选型决策树

```text
月预算必须 ≤ $10？
├─ 是 → OpenCode Go（Qwen3.5 Plus / DeepSeek V4 Flash）
│        接受可能触顶、国内需稳定访问 opencode.ai
└─ 否 → 要最好代码质量？
         ├─ 是 → OpenRouter 或 Zen + Claude Sonnet（按量 ~$30+/月）
         └─ 否 → OpenRouter + Gemini 2.5 Flash（按量 ~$25～45/月，4h/天）

已有 ChatGPT Plus（$20）？
└─ 可 /connect → OpenAI → ChatGPT 登录，与 OpenRouter/Go 并行

认准 Claude、愿付 $20+？
└─ 考虑 Claude Code（官方），而非 OpenCode 里绑 Claude 订阅
```

### 综合推荐（Java 全栈 + 每天 4h + 两台电脑）

| 优先级 | 方案 |
|--------|------|
| **首选** | OpenRouter + `google/gemini-2.5-flash`，月预算按 **~$30** 规划 |
| **必须 $10** | OpenCode Go + Qwen3.5 Plus，监控额度 |
| **已有稳定代理 + 想包月** | Go $10/月可作补充，大活仍建议 Flash/Sonnet |

---

## 十一、常见问题排查

| 现象 | 处理 |
|------|------|
| `/connect` 后不知道干嘛 | 已连上，执行 `/models` 选固定模型 |
| 认证失败 | 重新 `/connect`；检查 Key 与余额 |
| 模型找不到 | 对照 [openrouter.ai/models](https://openrouter.ai/models) 完整 ID |
| 仍走 Auto Router | `/models` 改选具体模型 |
| Go 提示 No payment method | 到 opencode.ai 控制台验证支付方式 |
| 地区不可用 | 换稳定出口 IP；避免频繁切换节点 |
| 超 Go 额度 | 用免费模型，或开 Use balance + Zen 充值 |
| 两台电脑模型不一致 | 统一项目 `opencode.json` 并 Git 同步 |
| Go 有没有 Auto 换模型 | **没有**，需 `/models` 手动切，见 [§4.5](#45-小技巧模型选择与切换) |
| 团队多人能各订 Go 吗 | 同一 Workspace **只能 1 人订**，见 [§4.6](#46-说明事项每个-workspace-只能一名成员订阅-go) |

---

## 十二、参考链接

| 资源 | 地址 |
|------|------|
| OpenCode 官网 | https://opencode.ai |
| OpenCode 配置文档 | https://dev.opencode.ai/docs/config |
| OpenCode 提供商文档 | https://opencode.ai/docs/providers |
| OpenCode Go 文档 | https://opencode.ai/docs/go |
| OpenCode Zen 文档 | https://opencode.ai/docs/zen |
| OpenRouter 官网 | https://openrouter.ai |
| OpenRouter 集成 OpenCode | https://openrouter.ai/docs/cookbook/coding-agents/opencode-integration |
| OpenRouter 模型列表 | https://openrouter.ai/models |
| OpenRouter 充值 | https://openrouter.ai/settings/credits |
| OpenCode 登录/订阅 | https://opencode.ai/auth |
| OpenCode Go 订阅页 | https://opencode.ai/go |

---

> 文档整理自 OpenCode + OpenRouter + OpenCode Go 实践与官方文档，适用于 Windows 终端环境。价格与限额以各平台官网实时信息为准。
