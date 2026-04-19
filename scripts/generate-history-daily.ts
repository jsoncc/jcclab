import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Solar } from 'lunar-javascript'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const historyDir = path.join(rootDir, 'src', 'assets', 'history')
const SECTION_ORDER = [
  '🏛️ 古代印记',
  '🌍 近现代·国际',
  '💻 科技与互联网',
  '🇨🇳 中国近现代',
  '🌐 国际要闻',
  '🌟 今日出生',
  '⚰️ 今日逝世',
  '👨‍💻 程序员视角'
] as const

const FESTIVAL_MAP: Record<string, { name: string; intro: string }> = {
  '01-01': { name: '元旦', intro: '公历新年的第一天，象征新的时间周期开启。' },
  '02-14': { name: '情人节（Valentine\'s Day）', intro: '广泛流行的节日，常以鲜花与卡片表达情感。' },
  '03-08': { name: '国际妇女节', intro: '关注女性权益、劳动贡献与社会平等的重要纪念日。' },
  '04-01': { name: '愚人节', intro: '以善意玩笑和轻松互动为主的民间节日文化。' },
  '04-22': { name: '世界地球日', intro: '倡导环境保护、可持续发展与公众生态意识提升。' },
  '05-01': { name: '国际劳动节', intro: '纪念劳动价值，关注劳动者权益与社会保障。' },
  '05-04': { name: '中国青年节', intro: '纪念青年运动传统，鼓励青年担当与创新精神。' },
  '06-01': { name: '国际儿童节', intro: '聚焦儿童成长、教育与健康发展。' },
  '07-01': { name: '中国共产党建党纪念日', intro: '中国共产党成立纪念日，常见主题教育活动。' },
  '08-01': { name: '中国人民解放军建军节', intro: '纪念人民军队建设发展历程的重要日期。' },
  '09-10': { name: '中国教师节', intro: '向教育工作者致敬，强调教育与人才培养的价值。' },
  '10-01': { name: '中华人民共和国国庆节', intro: '纪念新中国成立的重要国家节日。' },
  '12-25': { name: '圣诞节（Christmas）', intro: '在全球范围具有广泛影响的文化节日。' }
}

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

function listHistoryFiles(): string[] {
  return fs
    .readdirSync(historyDir)
    .filter((name) => /^history-\d{4}-\d{2}-\d{2}\.md$/.test(name))
    .sort()
}

function formatChineseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const weekday = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    weekday: 'long'
  }).format(new Date(Date.UTC(year, month - 1, day)))
  return `${year}年${month}月${day}日 ${weekday}`
}

function formatLunarLine(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  return lunar.toString()
}

function buildFixedFestivalBody(targetDate: string): string | null {
  const mmdd = targetDate.slice(5)
  const festival = FESTIVAL_MAP[mmdd]
  if (!festival) return null
  return [festival.name, '', festival.intro].join('\n')
}

function buildJieQiFestivalBody(isoDate: string): string | null {
  const [year, month, day] = isoDate.split('-').map(Number)
  const solar = Solar.fromYmd(year, month, day)
  const lunar = solar.getLunar()
  const jieQi = lunar.getJieQi()
  if (!jieQi) return null

  const introMap: Record<string, string> = {
    谷雨: '谷雨是春季最后一个节气，意味着降雨增多、万物生长加速，传统上也与农事安排和物候观察密切相关。'
  }

  const intro =
    introMap[jieQi] ??
    `${jieQi}是二十四节气之一，用于指导农事与物候观察，也承载着中国传统时间文化中的节律感。`

  return [`${jieQi}（二十四节气）`, '', intro].join('\n')
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

function parseSections(md: string): Record<string, string> {
  const lines = stripBom(md).replace(/\r\n/g, '\n').split('\n')
  const sections: Record<string, string> = {}
  let currentTitle: string | null = null
  let buffer: string[] = []

  const flush = (): void => {
    if (!currentTitle) return
    sections[currentTitle.trim()] = buffer.join('\n').trim()
  }

  for (const line of lines) {
    const match = line.trimStart().match(/^##\s+(.+)$/)
    if (match) {
      flush()
      currentTitle = match[1].trim()
      buffer = []
      continue
    }
    if (currentTitle) buffer.push(line)
  }
  flush()
  return sections
}

function normalizeSectionKey(value: string): string {
  return value.normalize('NFC').replace(/\s+/g, ' ').trim()
}

function trimTrailingSeparators(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  while (lines.length > 0) {
    const last = lines[lines.length - 1]?.trim() ?? ''
    if (last === '' || last === '---') {
      lines.pop()
      continue
    }
    break
  }
  return lines.join('\n').trimEnd()
}

function pickSectionContent(files: string[], sectionName: string, excludeFileName?: string): string {
  const wanted = normalizeSectionKey(sectionName)
  for (let i = files.length - 1; i >= 0; i -= 1) {
    if (excludeFileName && files[i] === excludeFileName) continue
    const filePath = path.join(historyDir, files[i])
    const content = fs.readFileSync(filePath, 'utf8')
    const sections = parseSections(content)
    const direct = sections[sectionName]
    if (direct) return trimTrailingSeparators(direct)

    const matchedKey = Object.keys(sections).find((key) => normalizeSectionKey(key) === wanted)
    if (matchedKey && sections[matchedKey]) return trimTrailingSeparators(sections[matchedKey])
  }
  return '- 暂无可用历史条目，后续将持续补充。'
}

function buildFestivalSection(targetDate: string): string {
  const fixedBody = buildFixedFestivalBody(targetDate)
  const jieQiBody = buildJieQiFestivalBody(targetDate)
  if (!fixedBody && !jieQiBody) return ''

  const blocks = [fixedBody, jieQiBody].filter(Boolean).join('\n\n')

  return ['## 🎈 今日节日', '', blocks, ''].join('\n')
}

function buildMarkdown(targetDate: string, files: string[], excludeFileName?: string): string {
  const headingDate = formatChineseDate(targetDate)
  const lunarText = formatLunarLine(targetDate)
  const festivalSection = buildFestivalSection(targetDate)
  const sectionBlocks = SECTION_ORDER.map((name) => {
    const content = pickSectionContent(files, name, excludeFileName)
    return [`## ${name}`, '', content].join('\n')
  })
  const sections = sectionBlocks.join('\n\n---\n\n')

  const festivalBlock = festivalSection ? [festivalSection, '---', ''].join('\n') : ''

  return [
    `【历史上的今天】${targetDate}`,
    '',
    `📅 公历：${headingDate}`,
    '',
    `📆 农历：${lunarText}`,
    '',
    '✨ 每日一则历史回望，读懂时光里的故事',
    '',
    festivalBlock,
    sections,
    '✨ 历史不会重复，但总会惊人地相似 ✨'
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function main(): void {
  if (!fs.existsSync(historyDir)) {
    throw new Error(`未找到目录: ${historyDir}`)
  }

  const targetDate = resolveTargetDateIso()
  const targetFileName = `history-${targetDate}.md`
  const targetFilePath = path.join(historyDir, targetFileName)

  // 默认同定时任务行为：每次按固定结构重新生成；已存在则覆盖，不存在则新建。
  // 仅在本地需要保留手改稿时设置 SKIP_EXISTING_HISTORY_FILE=true 跳过已存在文件。
  const skipIfExists = process.env.SKIP_EXISTING_HISTORY_FILE === 'true'
  if (fs.existsSync(targetFilePath) && skipIfExists) {
    console.log(`目标文件已存在，跳过生成（SKIP_EXISTING_HISTORY_FILE=true）: ${targetFileName}`)
    return
  }

  const files = listHistoryFiles()
  if (files.length === 0) {
    throw new Error('history 目录为空，无法基于历史样例生成内容。')
  }

  const markdown = buildMarkdown(targetDate, files, targetFileName)
  fs.writeFileSync(targetFilePath, `${markdown}\n`, 'utf8')

  console.log(`已生成历史文件: ${path.relative(rootDir, targetFilePath)}`)
}

try {
  main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`generate-history-daily 失败: ${message}`)
  process.exit(1)
}
