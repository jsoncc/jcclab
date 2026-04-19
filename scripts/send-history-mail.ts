import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const historyDir = path.join(rootDir, 'src', 'assets', 'history')

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
  const value = process.env[name]
  if (!value) throw new Error(`缺少环境变量: ${name}`)
  return value
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
  const smtpPort = Number(process.env.SMTP_PORT ?? '465')
  const smtpUser = requireEnv('SMTP_USER')
  const smtpPass = requireEnv('SMTP_PASS')
  const mailTo = requireEnv('HISTORY_MAIL_TO')
  const mailFrom = process.env.HISTORY_MAIL_FROM ?? smtpUser
  const subjectPrefix = process.env.HISTORY_MAIL_SUBJECT_PREFIX ?? '历史上的今天'

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
    subject: `${subjectPrefix} ${targetDate}`,
    text: content
  })

  console.log(`邮件发送成功: ${mailTo} (${fileName})`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`send-history-mail 失败: ${message}`)
  process.exit(1)
})
