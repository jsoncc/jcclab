import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const historyDir = path.join(rootDir, 'src', 'assets', 'history')

/** 解析单行 KEY=VAL 环境文件（忽略 # 注释）。 */
function parseEnvFile(filePath: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!fs.existsSync(filePath)) return out
  const text = fs.readFileSync(filePath, 'utf8')
  for (const line of text.split(/\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    out[key] = val
  }
  return out
}

/** 合并 .env 与 .env.local；已在 shell / CI 中设置的变量优先生效。 */
function applyLocalEnvFiles(): void {
  const base = parseEnvFile(path.join(rootDir, '.env'))
  const local = parseEnvFile(path.join(rootDir, '.env.local'))
  const merged = { ...base, ...local }
  for (const [key, val] of Object.entries(merged)) {
    if (process.env[key] === undefined) process.env[key] = val
  }
}

applyLocalEnvFiles()

function getShanghaiTodayIso(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function resolveTargetDateIso(): string {
  const overrideDate = process.env.TARGET_DATE
  if (overrideDate && /^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) return overrideDate
  return addDays(getShanghaiTodayIso(), 1)
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`缺少环境变量: ${name}`)
  return value
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

async function main(): Promise<void> {
  const targetDate = resolveTargetDateIso()
  const fileName = `history-${targetDate}.md`
  const filePath = path.join(historyDir, fileName)

  if (!fs.existsSync(filePath)) {
    throw new Error(`未找到待发送文件: ${path.relative(rootDir, filePath)}`)
  }

  const content = fs.readFileSync(filePath, 'utf8')
  const smtpHost = requireEnv('SMTP_HOST')
  const smtpPortRaw = optionalEnv('SMTP_PORT')
  const smtpPort = Number(smtpPortRaw ?? '465')
  const smtpUser = requireEnv('SMTP_USER')
  const smtpPass = requireEnv('SMTP_PASS')
  const mailTo = requireEnv('HISTORY_MAIL_TO')
  const mailFrom = optionalEnv('HISTORY_MAIL_FROM') ?? smtpUser
  const subject = `【历史上的今天】${targetDate}`

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  })

  await transporter.sendMail({
    from: mailFrom,
    to: mailTo,
    subject,
    text: content
  })

  console.log(`邮件发送成功: ${mailTo} (${fileName})`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`send-history-mail 失败: ${message}`)
  process.exit(1)
})
