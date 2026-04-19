# 每日历史内容生成与邮件发送（GitHub Actions）

该方案在云端执行，不占用本机 CPU。  
每天北京时间 21:30 自动生成次日文件并发送到指定邮箱。

## 1) 生成文件规则

- 目录：`src/assets/history/`
- 命名：`history-YYYY-MM-DD.md`
- 日期：按北京时间“次日”生成（例如 4 月 19 日执行，生成 4 月 20 日文件）
- 节日模块：有节日则展示“今日节日”，无节日则不展示该模块

## 2) 必填 GitHub Secrets

- `SMTP_HOST`：QQ 邮箱通常为 `smtp.qq.com`
- `SMTP_PORT`：QQ 邮箱通常为 `465`
- `SMTP_USER`：发件邮箱（例如 `896415482@qq.com`）
- `SMTP_PASS`：QQ 邮箱 SMTP 授权码（不是登录密码）
- `HISTORY_MAIL_TO`：收件邮箱（例如 `896415482@qq.com`）
- `HISTORY_MAIL_FROM`：发件显示名（可选，默认 `SMTP_USER`）
- `HISTORY_MAIL_SUBJECT_PREFIX`：邮件标题前缀（可选，默认 `历史上的今天`）

## 3) 本地调试命令

```bash
npm run history:generate
npm run history:send-mail
```

可通过环境变量覆盖目标日期（用于测试）：

```bash
TARGET_DATE=2026-04-20 npm run history:daily
```

## 4) Workflow 说明

- 文件：`.github/workflows/history-daily-mail.yml`
- 定时表达式：`30 13 * * *`（UTC，对应北京时间 21:30）
- 支持 `workflow_dispatch` 手动触发
- 当前为“免费方案A”：不依赖 AI 接口，基于 `history` 目录已有内容重组生成次日稿件
