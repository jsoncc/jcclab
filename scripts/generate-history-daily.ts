import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Solar } from 'lunar-javascript'
import * as OpenCC from 'opencc-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const historyDir = path.join(rootDir, 'src', 'assets', 'history')

/** 全文收尾句；若被 parseSections 吃进「程序员视角」区块，会与 buildMarkdown 末尾再追加的一次重复，需在抽取章节时剥掉。 */
const HISTORY_CLOSING_LINE = '✨ 历史不会重复，但总会惊人地相似 ✨'
const toSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' })

const SECTION_ORDER = [
  '🏛️ 古代印记',
  '🌍 近现代·国际',
  '💻 科技与互联网',
  '🇨🇳 中国近现代',
  '🌐 国际要闻',
  '🌟 今日出生',
  '⚰️ 今日逝世',
  '🔥 今日热榜'
] as const

const FESTIVAL_MAP: Record<string, { name: string; intro: string }> = {
  '01-01': { name: '元旦', intro: '公历新年的第一天，象征新的时间周期开启。' },
  '02-14': { name: '情人节（Valentine\'s Day）', intro: '广泛流行的节日，常以鲜花与卡片表达情感。' },
  '03-08': { name: '国际妇女节', intro: '关注女性权益、劳动贡献与社会平等的重要纪念日。' },
  '04-01': { name: '愚人节', intro: '以善意玩笑和轻松互动为主的民间节日文化。' },
  '04-22': { name: '世界地球日', intro: '倡导环境保护、可持续发展与公众生态意识提升。' },
  '04-24': { name: '世界实验动物日', intro: '每年4月24日的国际纪念日，倡导科学、人道地开展动物实验，尊重实验动物为医学与人类健康事业做出的贡献。' },
  '04-25': { name: '全国儿童预防接种宣传日', intro: '每年4月25日设立的全国性健康宣传日，旨在普及免疫规划知识，提升公众对疫苗接种与儿童传染病预防的科学认知。' },
  '04-26': { name: '世界知识产权日', intro: '由世界知识产权组织设立，旨在提升公众对专利、版权、商标等知识产权保护与创新激励作用的认知。' },
  '04-27': { name: '世界平面设计日', intro: '以全球设计组织成立纪念日为背景，倡导以视觉设计提升公共沟通、信息可读性与文化传播质量。' },
  '04-28': { name: '世界安全生产与健康日', intro: '由国际劳工组织推动设立，旨在提升公众对职业安全与健康管理的重视，倡导通过制度与技术手段减少工伤和职业病风险。' },
  '05-01': { name: '国际劳动节', intro: '纪念劳动价值，关注劳动者权益与社会保障。' },
  '05-04': { name: '中国青年节', intro: '纪念青年运动传统，鼓励青年担当与创新精神。' },
  '06-01': { name: '国际儿童节', intro: '聚焦儿童成长、教育与健康发展。' },
  '07-01': { name: '中国共产党建党纪念日', intro: '中国共产党成立纪念日，常见主题教育活动。' },
  '08-01': { name: '中国人民解放军建军节', intro: '纪念人民军队建设发展历程的重要日期。' },
  '09-10': { name: '中国教师节', intro: '向教育工作者致敬，强调教育与人才培养的价值。' },
  '10-01': { name: '中华人民共和国国庆节', intro: '纪念新中国成立的重要国家节日。' },
  '12-25': { name: '圣诞节（Christmas）', intro: '在全球范围具有广泛影响的文化节日。' }
}

const HOLIDAY_INTRO_MAP: Record<string, string> = {
  世界知识产权日: '由世界知识产权组织设立，旨在提升公众对专利、版权、商标等知识产权保护与创新激励作用的认知。',
  国际切尔诺贝利灾难纪念日: '联合国设立的国际纪念日，用于缅怀核事故受害者并强调核安全、环境修复与长期公共健康治理的重要性。',
  中国航天日: '中国航天日设于每年4月24日，纪念中国航天事业的重要里程碑，相关活动聚焦航天科普、技术创新与青年教育。',
  全国儿童预防接种宣传日: '每年4月25日设立的全国性健康宣传日，旨在普及免疫规划知识，提升公众对疫苗接种与儿童传染病预防的科学认知。',
  世界实验动物日: '每年4月24日的国际纪念日，倡导科学、人道地开展动物实验，尊重实验动物为医学与人类健康事业做出的贡献。'
  ,
  世界平面设计日: '以全球设计组织成立纪念日为背景，强调平面设计在公共传播、信息可视化与品牌沟通中的长期价值。',
  国王日: '荷兰全国性节日，用于庆祝国王生日，常见全民市集、音乐活动与橙色主题庆典。'
  ,
  世界安全生产与健康日: '由国际劳工组织推动设立，旨在提升公众对职业安全与健康管理的重视，倡导通过制度与技术手段减少工伤和职业病风险。'
}

type WikiPage = {
  titles?: { normalized?: string }
}

type WikiItem = {
  year?: number
  text?: string
  pages?: WikiPage[]
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

function buildFestivalSection(targetDate: string): string {
  const fixedBody = buildFixedFestivalBody(targetDate)
  const jieQiBody = buildJieQiFestivalBody(targetDate)
  if (!fixedBody && !jieQiBody) return ''

  const blocks = [fixedBody, jieQiBody].filter(Boolean).join('\n\n')

  return ['## 🎈 今日节日', '', blocks, ''].join('\n')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function shortText(text: string, max = 90): string {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

function pickTitle(item: WikiItem): string {
  const pageTitle = item.pages?.[0]?.titles?.normalized?.trim()
  if (pageTitle) return pageTitle
  const text = item.text?.trim() ?? ''
  if (!text) return '历史事件'
  return shortText(text, 24)
}

function normalizePunctuation(text: string): string {
  return text.replace(/：/g, ':').replace(/\s+/g, ' ').trim()
}

function parseHolidayEntry(item: WikiItem): { title: string; intro: string } {
  const rawText = shortText(item.text ?? '', 140)
  const titleCandidate = pickTitle(item).trim()
  const normalized = normalizePunctuation(rawText)

  // 常见结构：国家/地区: 节日名
  const colonIdx = normalized.indexOf(':')
  if (colonIdx > 0) {
    const left = normalized.slice(0, colonIdx).trim()
    const right = normalized.slice(colonIdx + 1).trim()
    if (right) {
      return {
        title: right.length <= 30 ? `${right}（${left}）` : right,
        intro: `${left}在这一天纪念该历史节点。`
      }
    }
  }

  const countryLike = /^[\u4e00-\u9fa5A-Za-z]{1,6}$/.test(titleCandidate)
  if (countryLike && normalized.startsWith(`${titleCandidate}:`)) {
    const right = normalized.slice(titleCandidate.length + 1).trim()
    if (right) {
      return {
        title: `${right}（${titleCandidate}）`,
        intro: `${titleCandidate}在这一天纪念该历史节点。`
      }
    }
  }

  const cleanedTitle = (titleCandidate || '今日纪念日')
    .replace(/^[-—:：)\]】}\s]+/, '')
    .replace(/\s*（英语）\s*$/i, '')
    .replace(/\s*\(英语\)\s*$/i, '')
    .trim()
  const cleanedIntro = (rawText || `${cleanedTitle}是当日纪念节点。`)
    .replace(/^[-—:：)\]】}\s]+/, '')
    .replace(/\s*（英语）\s*$/i, '')
    .replace(/\s*\(英语\)\s*$/i, '')
    .trim()

  return {
    title: cleanedTitle || '今日纪念日',
    intro: cleanedIntro || `${cleanedTitle || '该节日'}是当日纪念节点。`
  }
}

function toBullet(item: WikiItem, fallbackYear = '佚年'): string {
  const year = Number.isFinite(item.year) ? String(item.year) : fallbackYear
  const text = item.text?.trim() || pickTitle(item)
  return `- ${year}年 — ${text}`
}

async function fetchWikiList(kind: 'events' | 'births' | 'deaths' | 'holidays', month: number, day: number): Promise<WikiItem[]> {
  const url = `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/${kind}/${month}/${day}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'jcclab-history-generator/1.0'
    }
  })
  if (!response.ok) {
    throw new Error(`拉取 ${kind} 失败: HTTP ${response.status}`)
  }
  const data = (await response.json()) as { [key: string]: unknown }
  const raw = data[kind]
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is WikiItem => typeof item === 'object' && item !== null)
}

async function fetchMuffinLabs(targetDate: string): Promise<OnlineSource> {
  const [year, month, day] = targetDate.split('-').map(Number)
  if (!year || !month || !day) throw new Error(`非法日期: ${targetDate}`)
  const url = `https://history.muffinlabs.com/date/${month}/${day}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'jcclab-history-generator/1.0'
    }
  })
  if (!response.ok) {
    throw new Error(`备用源拉取失败: HTTP ${response.status}`)
  }
  const data = (await response.json()) as {
    data?: {
      Events?: Array<{ year?: string; text?: string }>
      Births?: Array<{ year?: string; text?: string }>
      Deaths?: Array<{ year?: string; text?: string }>
    }
  }
  const eventsRaw = data.data?.Events ?? []
  const birthsRaw = data.data?.Births ?? []
  const deathsRaw = data.data?.Deaths ?? []
  const toWiki = (arr: Array<{ year?: string; text?: string }>): WikiItem[] =>
    arr
      .filter((item) => typeof item?.text === 'string' && item.text.trim().length > 0)
      .map((item) => ({
        year: Number(item.year),
        text: item.text
      }))
  return {
    events: toWiki(eventsRaw),
    births: toWiki(birthsRaw),
    deaths: toWiki(deathsRaw),
    holidays: [],
    techHints: []
  }
}

type OnlineSource = {
  events: WikiItem[]
  births: WikiItem[]
  deaths: WikiItem[]
  holidays: WikiItem[]
  techHints: WikiItem[]
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function normalizeDateLabel(targetDate: string): { month: number; day: number; label: string } {
  const [year, month, day] = targetDate.split('-').map(Number)
  if (!year || !month || !day) throw new Error(`非法日期: ${targetDate}`)
  return { month, day, label: `${month}月${day}日` }
}

function toYear(value: string): number | undefined {
  const cleaned = value.trim()
  if (!cleaned) return undefined
  if (cleaned.startsWith('前')) {
    const n = Number(cleaned.slice(1))
    return Number.isFinite(n) ? -n : undefined
  }
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function isMeaningfulText(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (/^[-—–_\s·.]+$/.test(t)) return false
  const nonSymbol = t.replace(/[-—–_\s·.，,。；;:：()（）【】[\]{}]/g, '')
  return nonSymbol.length >= 2
}

function extractBaiduItems(raw: string): OnlineSource {
  const cleaned = decodeHtmlEntities(
    raw
      .replace(/<script[\s\S]*?<\/script>/gi, '\n')
      .replace(/<style[\s\S]*?<\/style>/gi, '\n')
      .replace(/<[^>]+>/g, '\n')
  )
    .replace(/\r\n/g, '\n')
    .replace(/\n{2,}/g, '\n')

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length >= 6 && line.length <= 140)

  const events: WikiItem[] = []
  const births: WikiItem[] = []
  const deaths: WikiItem[] = []
  const holidays: WikiItem[] = []

  const eventReg = /^(前?\d{1,4})年[—\-–:：]?\s*(.+)$/
  const holidayReg = /^(世界|国际|全国|中国|地球|海军|航天).*(日|节|纪念日)$/

  for (const line of lines) {
    const m = line.match(eventReg)
    if (m) {
      const year = toYear(m[1])
      const text = m[2].trim()
      if (!isMeaningfulText(text)) continue
      const item: WikiItem = { year, text }
      if (/出生/.test(text)) births.push(item)
      else if (/逝世|去世|病逝|离世|辞世|身亡|遇难/.test(text)) deaths.push(item)
      else events.push(item)
      continue
    }
    if (holidayReg.test(line) && !/星期|农历|公历/.test(line) && isMeaningfulText(line)) {
      holidays.push({ text: line })
    }
  }

  return {
    events: selectUniqueByText(events, 40),
    births: selectUniqueByText(births, 20),
    deaths: selectUniqueByText(deaths, 20),
    holidays: selectUniqueByText(holidays, 6),
    techHints: pickEvents(events, (item) => containsKeyword(item.text ?? '', TECH_KEYWORDS), 8)
  }
}

function filterMeaningful(items: WikiItem[]): WikiItem[] {
  return items.filter((item) => isMeaningfulText(item.text ?? ''))
}

function filterChinesePreferred(items: WikiItem[]): WikiItem[] {
  const meaningful = filterMeaningful(items)
  const chinese = meaningful.filter((item) => hasChinese(item.text ?? ''))
  return chinese.length > 0 ? chinese : meaningful
}

async function fetchBaiduBaike(targetDate: string): Promise<OnlineSource> {
  const { label } = normalizeDateLabel(targetDate)
  const url = `https://baike.baidu.com/item/${encodeURIComponent(label)}`
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    }
  })
  if (!response.ok) {
    throw new Error(`百度百科拉取失败: HTTP ${response.status}`)
  }
  const html = await response.text()
  const parsed = extractBaiduItems(html)
  return parsed
}

async function fetchOnlineSource(targetDate: string): Promise<OnlineSource> {
  const { month, day } = normalizeDateLabel(targetDate)

  // 优先百度百科：当前仅对“节日”使用百度数据，事件类条目仍走更稳定的数据源，避免半截文本污染正文
  let baiduHolidays: WikiItem[] = []
  let baiduTechHints: WikiItem[] = []
  try {
    const baidu = await fetchBaiduBaike(targetDate)
    baiduHolidays = filterChinesePreferred(baidu.holidays)
    baiduTechHints = filterMeaningful(baidu.techHints)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`百度百科不可用，回退其他源: ${message}`)
  }

  try {
    const [events, births, deaths, holidays] = await Promise.all([
      fetchWikiList('events', month, day),
      fetchWikiList('births', month, day),
      fetchWikiList('deaths', month, day),
      fetchWikiList('holidays', month, day)
    ])
    return {
      events,
      births,
      deaths,
      holidays: ensureMin(baiduHolidays, holidays, 4),
      techHints: baiduTechHints
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`主数据源不可用，切换备用源: ${message}`)
    const fallback = await fetchMuffinLabs(targetDate)
    return {
      events: fallback.events,
      births: fallback.births,
      deaths: fallback.deaths,
      holidays: baiduHolidays,
      techHints: baiduTechHints
    }
  }
}

const CHINA_KEYWORDS = ['中国', '中华', '北京', '上海', '南京', '广州', '香港', '台湾', '清朝', '民国', '中华人民共和国', '中国共产党']
const TECH_KEYWORDS = [
  '计算机',
  '互联网',
  '网络',
  '软件',
  '硬件',
  '卫星',
  '航天',
  'AI',
  '人工智能',
  '机器学习',
  '芯片',
  '电信',
  '通信',
  '平台',
  'Java',
  'Python',
  'Golang',
  'Go',
  'Vue',
  'React',
  '前端',
  '后端',
  '数据库',
  '云计算',
  '微服务',
  '手机',
  '智能手机',
  'Galaxy',
  'A380',
  '试飞',
  '卫星发射',
  '开源',
  '开发者'
]



function containsKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => new RegExp(escapeRegExp(keyword), 'i').test(text))
}

function selectUniqueByText(items: WikiItem[], limit: number): WikiItem[] {
  const seen = new Set<string>()
  const out: WikiItem[] = []
  for (const item of items) {
    const normalizedText = toSimplified((item.text ?? '').trim())
    const key = `${item.year ?? ''}|${normalizedText}`.trim()
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(item)
    if (out.length >= limit) break
  }
  return out
}

function pickEvents(source: WikiItem[], predicate: (item: WikiItem) => boolean, limit: number): WikiItem[] {
  return selectUniqueByText(source.filter(predicate), limit)
}

function ensureMin(items: WikiItem[], fallback: WikiItem[], limit: number): WikiItem[] {
  if (items.length >= limit) return items.slice(0, limit)
  const merged = [...items]
  for (const item of fallback) {
    if (merged.length >= limit) break
    merged.push(item)
  }
  return selectUniqueByText(merged, limit)
}

function buildSectionText(items: WikiItem[], fallbackText: string, limit = 4): string {
  const selected = selectUniqueByText(items, limit)
  if (selected.length === 0) return `- ${fallbackText}`
  return selected.map((item) => toBullet(item)).join('\n\n')
}

function normalizeFestivalTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .trim()
}

function pickHolidayIntro(title: string, intro: string): string {
  const key = normalizeFestivalTitle(title)
  const mapped = HOLIDAY_INTRO_MAP[key]
  if (mapped) return mapped
  return intro
}

function isGarbageHolidayTitle(title: string): boolean {
  const t = title.trim()
  if (!t) return true
  if (t.length <= 1) return true
  if (/^[\u4e00-\u9fa5A-Za-z]{1,6}$/.test(t)) return true // 仅国家/地区短词
  if (/[}{[\]<>]/.test(t)) return true
  if (/[)]{2,}|[（)]{3,}/.test(t)) return true
  return false
}

function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

function buildHolidayBlocksFromOnline(holidays: WikiItem[], knownTitles: Set<string>): string[] {
  const parsed = holidays
    .map(parseHolidayEntry)
    .map(({ title, intro }) => ({
      title: title.trim(),
      intro: intro.trim()
    }))
    .filter(({ title, intro }) => !isGarbageHolidayTitle(title) && (hasChinese(title) || hasChinese(intro)))
    .map(({ title, intro }) => {
      const t = toSimplified(title)
      const i = toSimplified(intro)
      const titleOnly = normalizeFestivalTitle(t)
      const introOnly = normalizeFestivalTitle(i)
      const introIsUseless = !i || introOnly === titleOnly || i.length < 8
      const resolvedIntro = introIsUseless ? `${t}是当日的重要纪念节点。` : i
      return {
        title: t,
        intro: pickHolidayIntro(t, resolvedIntro)
      }
    })

  const blocks: string[] = []
  const seen = new Set<string>()
  for (const item of parsed) {
    const key = normalizeFestivalTitle(item.title)
    if (!key) continue
    if (knownTitles.has(key)) continue
    if (seen.has(key)) continue
    seen.add(key)
    blocks.push([item.title, '', item.intro].join('\n'))
    if (blocks.length >= 2) break
  }
  return blocks
}

function buildFestivalSectionMerged(targetDate: string, holidays: WikiItem[]): string {
  const fixedBody = buildFixedFestivalBody(targetDate)
  const jieQiBody = buildJieQiFestivalBody(targetDate)

  const known = new Set<string>()
  if (fixedBody) known.add(normalizeFestivalTitle(fixedBody.split('\n')[0] ?? ''))
  if (jieQiBody) known.add(normalizeFestivalTitle(jieQiBody.split('\n')[0] ?? ''))

  const onlineBlocks = buildHolidayBlocksFromOnline(holidays, known)
  const blocks = [fixedBody, jieQiBody, ...onlineBlocks].filter(Boolean).join('\n\n')
  if (!blocks) return ''
  return ['## 🎈 今日节日', '', blocks, ''].join('\n')
}

type HotTopic = {
  rank: number
  title: string
  url: string
  summary?: string
}

function decodeHtmlEntitiesForHot(text: string): string {
  return decodeHtmlEntities(text)
}

function extractBaikeTopicText(text: string): string {
  return decodeHtmlEntitiesForHot(text)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
}

function shortSummary(text: string, max = 240): string {
  const cleaned = decodeHtmlEntitiesForHot(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

async function fetchHotTopics(): Promise<HotTopic[]> {
  const url = 'https://tophub.today/hot'
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    }
  })
  if (!response.ok) {
    throw new Error(`抓取 tophub 失败: HTTP ${response.status}`)
  }
  const html = await response.text()

  // 真实榜单容器：<ul class="rank-all-item daily-rank-list">
  // 每条：<li class="child-item">，内部有 <a href="..." itemid="..."> 包裹标题
  // 排序：取前 10 条
  const listStart = html.indexOf('rank-all-item daily-rank-list')
  if (listStart < 0) {
    throw new Error('未找到热搜榜单容器（rank-all-item daily-rank-list）')
  }
  // 截取到 "我是有底线的"（榜单结束）
  const bottomIdx = html.indexOf('我是有底线的', listStart)
  const sectionHtml = bottomIdx > 0 ? html.slice(listStart, bottomIdx) : html.slice(listStart)

  // 匹配每条 <li class="child-item">...</li>
  const itemRegex = /<li class="child-item">([\s\S]{0,3000}?)<\/li>/g
  const topics: HotTopic[] = []
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(sectionHtml)) !== null) {
    if (topics.length >= 10) break
    const item = m[1]

    // 提取链接和 itemid
    const linkMatch = item.match(/<a[^>]*href="(https?:\/\/[^"]+)"[^>]*itemid="(\d+)"/)
    if (!linkMatch) continue
    const linkUrl = linkMatch[1]
    const itemid = linkMatch[2]

    // 提取标题：取 itemid 所在 <a> 标签的文本
    const titleMatch = item.match(new RegExp(`itemid="${itemid}">([\\s\\S]{0,500}?)</a>`))
    if (!titleMatch) continue
    const title = titleMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    if (!title) continue

    // 序号 = 当前已抓到的数量 + 1
    topics.push({ rank: topics.length + 1, title, url: linkUrl })
  }

  if (topics.length === 0) {
    throw new Error('解析热搜列表失败：未匹配到任何条目')
  }
  return topics
}

async function fetchTopicSummaryWithSearch(topic: HotTopic): Promise<string | null> {
  // 尝试多个搜索 query，按完整标题搜索
  const queries = [
    topic.title,
    topic.title.replace(/[？?！!，,。.\s]+/g, ' ').trim()
  ]

  for (const query of queries) {
    const result = await searchWithBaidu(query) || await searchWithBing(query)
    if (result) return result
  }
  return null
}

async function searchWithBaidu(query: string): Promise<string | null> {
  try {
    const url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    })
    if (!response.ok) return null
    const html = await response.text()
    const decoded = extractBaikeTopicText(html)

    // 提取百度搜索结果的摘要
    const abstracts: string[] = []
    const abstractRegex = /[\u4e00-\u9fa5][\u4e00-\u9fa5A-Za-z0-9，。；：、！？""''《》（）()\s,.!?;:'"-]{30,300}/g
    let match: RegExpExecArray | null
    while ((match = abstractRegex.exec(decoded)) !== null) {
      const text = match[0].trim()
      if (
        !text.includes('百度') &&
        !text.includes('为您找到') &&
        !text.includes('相关搜索') &&
        !text.includes('网页') &&
        !text.includes('图片') &&
        !text.includes('资讯') &&
        text.length >= 40
      ) {
        abstracts.push(text)
        if (abstracts.length >= 3) break
      }
    }
    if (abstracts.length > 0) {
      return shortSummary(abstracts.join(' '), 280)
    }
    return null
  } catch {
    return null
  }
}

async function searchWithBing(query: string): Promise<string | null> {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    })
    if (!response.ok) return null
    const html = await response.text()
    const decoded = extractBaikeTopicText(html)
    const abstracts: string[] = []
    const abstractRegex = /[\u4e00-\u9fa5][\u4e00-\u9fa5A-Za-z0-9，。；：、！？""''《》（）()\s,.!?;:'"-]{30,300}/g
    let match: RegExpExecArray | null
    while ((match = abstractRegex.exec(decoded)) !== null) {
      const text = match[0].trim()
      if (
        !text.includes('Bing') &&
        !text.includes('必应') &&
        text.length >= 40
      ) {
        abstracts.push(text)
        if (abstracts.length >= 3) break
      }
    }
    if (abstracts.length > 0) {
      return shortSummary(abstracts.join(' '), 280)
    }
    return null
  } catch {
    return null
  }
}

async function buildHotSearchSection(): Promise<string> {
  try {
    const topics = await fetchHotTopics()
    if (topics.length === 0) {
      return '- 今日热榜数据源暂不可用，后续补充。'
    }

    const items: string[] = []
    for (const topic of topics) {
      // 跳过抓取失败的条目
      const summary = await fetchTopicSummaryWithSearch(topic)
      if (!summary) continue

      // 标题带上链接（无链接则保持纯文本）
      const heading = topic.url
        ? `### ${topic.rank}. [${topic.title}](${topic.url})`
        : `### ${topic.rank}. ${topic.title}`
      items.push(
        heading,
        `- **摘要**：${summary}`,
        ''
      )
    }

    if (items.length === 0) {
      return '- 今日热榜数据源抓取失败，后续补充。'
    }

    return `${items.join('\n').trim()}\n\n---\n\n✨ 关注实时热点，把握今日脉搏 ✨`
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return `- 今日热榜抓取失败: ${message}`
  }
}

async function buildMarkdown(targetDate: string, source: OnlineSource): Promise<string> {
  const headingDate = formatChineseDate(targetDate)
  const lunarText = formatLunarLine(targetDate)
  const festivalSection = buildFestivalSectionMerged(targetDate, source.holidays)
  const festivalBlock = festivalSection ? [festivalSection, '---', ''].join('\n') : ''

  const allEvents = selectUniqueByText(filterMeaningful(source.events), 50)
  const births = filterChinesePreferred(source.births)
  const deaths = filterChinesePreferred(source.deaths)
  const ancient = pickEvents(allEvents, (item) => (item.year ?? 99999) <= 1700, 3)
  const chinaModern = pickEvents(allEvents, (item) => (item.year ?? 0) >= 1800 && containsKeyword(item.text ?? '', CHINA_KEYWORDS), 4)
  const internationalModern = pickEvents(allEvents, (item) => (item.year ?? 0) >= 1701 && !containsKeyword(item.text ?? '', CHINA_KEYWORDS), 5)
  const tech = pickEvents(allEvents, (item) => containsKeyword(item.text ?? '', TECH_KEYWORDS), 4)
  const internationalNews = pickEvents(allEvents, (item) => (item.year ?? 0) >= 1990 && !containsKeyword(item.text ?? '', CHINA_KEYWORDS), 4)

  const sectionMap: Record<(typeof SECTION_ORDER)[number], string> = {
    '🏛️ 古代印记': buildSectionText(ensureMin(ancient, allEvents, 3), '暂无古代事件条目，后续补充。', 3),
    '🌍 近现代·国际': buildSectionText(ensureMin(internationalModern, allEvents, 5), '暂无近现代国际条目，后续补充。', 5),
    '💻 科技与互联网': buildSectionText(ensureMin(tech, internationalModern, 4), '暂无科技与互联网条目，后续补充。', 4),
    '🇨🇳 中国近现代': buildSectionText(ensureMin(chinaModern, allEvents.filter((item) => (item.year ?? 0) >= 1800), 4), '暂无中国近现代条目，后续补充。', 4),
    '🌐 国际要闻': buildSectionText(ensureMin(internationalNews, internationalModern, 4), '暂无国际要闻条目，后续补充。', 4),
    '🌟 今日出生': buildSectionText(births, '暂无今日出生条目，后续补充。', 4),
    '⚰️ 今日逝世': buildSectionText(deaths, '暂无今日逝世条目，后续补充。', 4),
    '🔥 今日热榜': await buildHotSearchSection()
  }

  const sections = SECTION_ORDER.map((name) => [`## ${name}`, '', sectionMap[name]].join('\n')).join('\n\n---\n\n')

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
    '',
    '---',
    '',
    HISTORY_CLOSING_LINE
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function qualityGate(markdown: string): string {
  let text = markdown

  // 1) 清理明显脏行（仅符号或异常括号残片）
  text = text
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      if (!t) return true
      if (/^[-—–_.,:：;；()\[\]{}<>]+$/.test(t)) return false
      if (/^[)）\]】}\s,，.。:：-]+/.test(t) && t.length < 12) return false
      return true
    })
    .join('\n')

  // 2) 节日介绍空洞句兜底替换
  text = text.replace(/^(.*)是当日的重要纪念节点。$/gm, (_m, p1: string) => {
    const title = p1.trim()
    const mapped = HOLIDAY_INTRO_MAP[normalizeFestivalTitle(title)]
    if (mapped) return mapped
    return `${title}是具有公共纪念意义的节点，常用于提示公众关注该主题背后的历史与现实问题。`
  })

  // 3) 程序员视角已移除（被今日热榜替代）

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

async function main(): Promise<void> {
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

  try {
    const source = await fetchOnlineSource(targetDate)
    const markdown = qualityGate(toSimplified(await buildMarkdown(targetDate, source)))
    fs.writeFileSync(targetFilePath, `${markdown}\n`, 'utf8')
    console.log(`已生成历史文件: ${path.relative(rootDir, targetFilePath)}`)
    console.log(`已联网拉取条目：events=${source.events.length}, births=${source.births.length}, deaths=${source.deaths.length}, holidays=${source.holidays.length}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`联网生成失败: ${message}`)
  }
}

try {
  await main()
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`generate-history-daily 失败: ${message}`)
  process.exit(1)
}
