/**
 * 每日热榜生成脚本
 * 抓取 tophub.today 实时热搜 Top 10 + 搜索引擎摘要
 * 输出 src/assets/hotnews/hotnews-YYYY-MM-DD.md
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildHotSearchSection,
  formatLunarLine,
  buildFestivalSection,
  buildJieQiSection
} from './_shared/hotnews-helpers.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const hotnewsDir = path.join(rootDir, 'src', 'assets', 'hotnews')

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
  // 抓取当天：cron 在 8/14/20 北京时间触发，文件名 = 当天日期
  return getShanghaiTodayIso()
}

function formatChineseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long'
  }).format(new Date(Date.UTC(year, month - 1, day)))
  return `${year}年${month}月${day}日 ${weekday}`
}

const HOTNEWS_CLOSING_LINE = '✨ 关注实时热点，把握今日脉搏 ✨'

/** 把 "### N. xxx" 列表包裹在 "## 🔥 今日热榜" 区块下，并把末尾的收尾句剥掉 */
function wrapAsSection(section: string): string {
  // 去掉 buildHotSearchSection 自带的收尾句
  const cleaned = section.replace(/\n*---\n*\n*✨ 关注实时热点.*$/s, '').trimEnd()
  if (!cleaned) return ''
  return `## 🔥 今日热榜\n\n${cleaned}\n\n---\n\n${HOTNEWS_CLOSING_LINE}`
}

async function buildHotnewsMarkdown(targetDate: string): Promise<string> {
  const headingDate = formatChineseDate(targetDate)
  const lunarText = formatLunarLine(targetDate)
  const festivalSection = buildFestivalSection(targetDate)
  const jieQiSection = buildJieQiSection(targetDate)
  const hotSearchSection = await buildHotSearchSection()
  const hotNewsBlock = wrapAsSection(hotSearchSection)

  return [
    `【今日热榜】${targetDate}`,
    '',
    `📅 公历：${headingDate}`,
    '',
    `📆 农历：${lunarText}`,
    '',
    '✨ 实时热点，洞察今日脉搏',
    '',
    festivalSection,
    jieQiSection,
    hotNewsBlock
  ]
    .filter((s) => s !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function main(): Promise<void> {
  if (!fs.existsSync(hotnewsDir)) {
    fs.mkdirSync(hotnewsDir, { recursive: true })
    console.log(`已创建目录: ${path.relative(rootDir, hotnewsDir)}`)
  }

  const targetDate = resolveTargetDateIso()
  const targetFileName = `hotnews-${targetDate}.md`
  const targetFilePath = path.join(hotnewsDir, targetFileName)

  const skipIfExists = process.env.SKIP_EXISTING_HOTNEWS_FILE === 'true'
  if (fs.existsSync(targetFilePath) && skipIfExists) {
    console.log(`目标文件已存在，跳过生成（SKIP_EXISTING_HOTNEWS_FILE=true）: ${targetFileName}`)
    return
  }

  try {
    const markdown = await buildHotnewsMarkdown(targetDate)
    fs.writeFileSync(targetFilePath, `${markdown}\n`, 'utf8')
    console.log(`已生成热榜文件: ${path.relative(rootDir, targetFilePath)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`生成热榜失败: ${message}`)
  }
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`generate-hotnews-daily 失败: ${message}`)
  process.exit(1)
}
