import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

function formatLunarPlaceholder(isoDate: string): string {
  // 免费方案不依赖外部农历 API，先保留占位信息，保证文档结构稳定。
  const [year, month, day] = isoDate.split('-')
  return `${year}年农历待补充（公历 ${month}月${day}日）`
}

function parseSections(md: string): Record<string, string> {
  const lines = md.split('\n')
  const sections: Record<string, string> = {}
  let currentTitle: string | null = null
  let buffer: string[] = []

  const flush = (): void => {
    if (!currentTitle) return
    sections[currentTitle] = buffer.join('\n').trim()
  }

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/)
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

function pickSectionContent(files: string[], sectionName: string): string {
  for (let i = files.length - 1; i >= 0; i -= 1) {
    const filePath = path.join(historyDir, files[i])
    const content = fs.readFileSync(filePath, 'utf8')
    const sections = parseSections(content)
    if (sections[sectionName]) return sections[sectionName]
  }
  return '- 暂无可用历史条目，后续将持续补充。'
}

function buildFestivalSection(targetDate: string): string {
  const mmdd = targetDate.slice(5)
  const festival = FESTIVAL_MAP[mmdd]
  if (!festival) return ''

  return [
    '## 🎈 今日节日',
    '',
    festival.name,
    '',
    festival.intro,
    '',
    '---',
    ''
  ].join('\n')
}

function buildMarkdown(targetDate: string, files: string[]): string {
  const headingDate = formatChineseDate(targetDate)
  const lunarText = formatLunarPlaceholder(targetDate)
  const festivalSection = buildFestivalSection(targetDate)
  const sections = SECTION_ORDER.map((name) => {
    const content = pickSectionContent(files, name)
    return [`## ${name}`, '', content, '', '---', ''].join('\n')
  }).join('\n')

  return [
    `${targetDate.replace(/-/g, '年').replace(/年(\d{2})$/, '月$1日')} 历史上的今天`,
    '',
    `📅 公历：${headingDate}`,
    '',
    `📆 农历：${lunarText}`,
    '',
    '✨ 每日一则历史回望，读懂时光里的故事',
    '',
    '---',
    '',
    festivalSection,
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

  const overwrite = process.env.OVERWRITE_HISTORY_FILE === 'true'
  if (fs.existsSync(targetFilePath) && !overwrite) {
    console.log(`目标文件已存在，跳过生成: ${targetFileName}`)
    return
  }

  const files = listHistoryFiles()
  if (files.length === 0) {
    throw new Error('history 目录为空，无法基于历史样例生成内容。')
  }

  const markdown = buildMarkdown(targetDate, files)
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
