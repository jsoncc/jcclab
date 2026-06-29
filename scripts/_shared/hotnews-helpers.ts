/**
 * 热榜抓取与摘要生成相关公共函数
 * 提取自 generate-history-daily.ts，供 generate-hotnews-daily.ts 复用
 */

export type HotTopic = {
  rank: number
  title: string
  url: string
  summary?: string
}

/** 解码 HTML 实体（&amp; &lt; 等） */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** 从 HTML 中去掉 script/style/标签，只保留文本 */
export function extractTextFromHtml(html: string): string {
  return decodeHtmlEntities(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
}

/** 截断摘要 */
export function shortSummary(text: string, max = 240): string {
  const cleaned = decodeHtmlEntities(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length <= max) return cleaned
  return `${cleaned.slice(0, max - 1)}…`
}

/**
 * 抓取 tophub.today 热搜 Top N
 * @param limit 取前 N 条，默认 10
 */
export async function fetchHotTopics(limit = 10): Promise<HotTopic[]> {
  const url = 'https://tophub.today/hot'
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
    }
  })
  if (!response.ok) {
    throw new Error(`抓取 tophub 失败: HTTP ${response.status}`)
  }
  const html = await response.text()

  // 真实榜单容器：<ul class="rank-all-item daily-rank-list">
  // 每条：<li class="child-item">，内部有 <a href="..." itemid="..."> 包裹标题
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
    if (topics.length >= limit) break
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 简单的随机延迟（毫秒） */
export function randomDelay(min = 800, max = 2500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min)) + min
  return sleep(ms)
}

export async function fetchTopicSummaryWithSearch(topic: HotTopic): Promise<string | null> {
  // 尝试多个搜索 query，按完整标题搜索
  const queries = [
    topic.title,
    topic.title.replace(/[？?！!，,。.\s]+/g, ' ').trim()
  ]

  for (const query of queries) {
    // 每次搜索前加随机延迟，避免触发反爬频率限制
    await randomDelay(600, 1500)
    const result = (await searchWithBaidu(query)) || (await searchWithBing(query))
    if (result) return result
  }
  return null
}

/** 抽象：过滤各种导航/验证页/界面文字 */
export const SKIP_TEXT_PATTERNS = [
  // Cloudflare 验证页
  'One last step',
  'Please solve the challenge',
  'Verify you are human',
  'cf-chl',
  'challenge-running',
  'Just a moment',
  'Verifying you are human',
  // 通用导航
  'Search Skip to content',
  'Accessibility Feedback',
  'Skip to content',
  // 百度界面
  '百度',
  '为您找到',
  '相关搜索',
  '网页',
  '图片',
  '资讯',
  '百度快照',
  '按时间排序',
  '按相关性排序',
  '百度热榜',
  '百度热搜',
  // Bing 界面
  'Bing',
  '必应',
  'Microsoft',
  'Privacy Policy',
  'Legal',
  // 微博界面
  '微博热搜',
  '微博搜索',
  '微博客户端',
  // 虎扑界面
  '虎扑社区',
  '虎扑',
  '步行街',
  '登录虎扑',
  // 通用干扰
  'JavaScript',
  'Cookies',
  'Enable JavaScript',
  '加载中',
  '正在加载',
  // tophub 侧边栏推荐内容
  '看见时间里的中国',
  'iDailyToday',
  '榜眼数据',
  '聚合全网',
  '热文库',
  // 热搜榜单特征词（密集出现说明抓的是榜单列表）
  '热搜榜',
  '今日热榜',
  '实时榜中榜',
  '日榜',
  '周榜',
  '月榜',
  '聚合热点',
  '热门话题',
  '热门微博',
  '热门知乎'
]

/** 提取查询中的核心中文词（>=2 字） */
export function extractQueryKeywords(query: string): string[] {
  return Array.from(new Set(query.match(/[\u4e00-\u9fa5]{2,}/g) || []))
}

/** 检测文本是否像"榜单列表"（带编号+短标题的密集列表） */
export function looksLikeRankList(text: string): boolean {
  // 检测模式："数字 + 空格 + 短文本" 出现 >= 3 次
  // 例如："1 世界杯 2 小男孩 3 地下管网 4 新华字典"
  const numberedItems = text.match(/\d+\s*[\u4e00-\u9fa5][^0-9]{2,15}/g) || []
  if (numberedItems.length >= 3) return true
  // 检测模式："数字 + 句号 + 文本" 出现 >= 3 次
  const dotItems = text.match(/\d+\.\s*[\u4e00-\u9fa5]/g) || []
  if (dotItems.length >= 5) return true
  return false
}

/** 检测是否包含大量"新/热"等榜单标记词（说明是榜单列表） */
export function hasRankMarkerDensity(text: string): boolean {
  // 短文本（<100字）里"新"或"热"超过 3 次
  if (text.length < 100) return false
  const markerCount = (text.match(/[\s\u4e00-\u9fa5][新热](\s|$|，|。|,)/g) || []).length
  return markerCount >= 4
}

/** 综合判断摘要是否有效 */
export function isValidAbstract(text: string, queryKeywords: string[] = []): boolean {
  // 长度检查
  if (text.length < 40 || text.length > 400) return false

  // 关键词黑名单
  for (const pattern of SKIP_TEXT_PATTERNS) {
    if (text.includes(pattern)) return false
  }

  // 必须包含足够的中文（>= 30%）
  const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  if (chineseCount / text.length < 0.3) return false

  // 不能全是标点
  const meaningful = text.replace(/[\s\p{P}]/gu, '')
  if (meaningful.length < 30) return false

  // 拒绝"榜单列表"特征
  if (looksLikeRankList(text)) return false

  // 拒绝高密度榜单标记词
  if (hasRankMarkerDensity(text)) return false

  // 关键词相关性检查（关键）
  if (queryKeywords.length > 0) {
    const matched = queryKeywords.filter((kw) => text.includes(kw))
    // 必须至少匹配 1/3 的查询关键词，且至少 1 个
    const requiredMatches = Math.max(1, Math.ceil(queryKeywords.length / 3))
    if (matched.length < requiredMatches) return false
  }

  return true
}

/** 智能提取搜索摘要（百度/Bing 通用） */
export function extractSearchAbstracts(html: string, query: string): string[] {
  const decoded = extractTextFromHtml(html)
  const queryKeywords = extractQueryKeywords(query)
  const abstracts: string[] = []
  const seen = new Set<string>()

  // 1. 优先尝试结构化选择器（百度 <div class="c-abstract"> / Bing <p class="b_paractl">）
  const structPatterns = [
    /<div[^>]*class="[^"]*\b(?:c-abstract|content-right_8Zs40|result-op\b)[^"]*"[^>]*>([\s\S]{30,500}?)<\/div>/g,
    /<p[^>]*class="[^"]*\bb_(?:paractl|algoSlug|caption|attribution)[^"]*"[^>]*>([\s\S]{30,500}?)<\/p>/g
  ]
  for (const re of structPatterns) {
    let m: RegExpExecArray | null
    while ((m = re.exec(decoded)) !== null) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      if (isValidAbstract(text, queryKeywords) && !seen.has(text)) {
        seen.add(text)
        abstracts.push(text)
        if (abstracts.length >= 3) break
      }
    }
    if (abstracts.length >= 3) break
  }
  if (abstracts.length >= 3) return abstracts

  // 2. 兜底用通用正则（提取所有"中文+标点+空格"的连续片段）
  const abstractRegex = /[\u4e00-\u9fa5][\u4e00-\u9fa5A-Za-z0-9，。；：、！\?"'《》（）()\s,.!?;:'"-]{50,400}/g
  let match: RegExpExecArray | null
  while ((match = abstractRegex.exec(decoded)) !== null) {
    const text = match[0].trim()
    if (text.length < 60) continue
    if (isValidAbstract(text, queryKeywords) && !seen.has(text)) {
      seen.add(text)
      abstracts.push(text)
      if (abstracts.length >= 3) break
    }
  }
  return abstracts
}

export async function searchWithBaidu(query: string): Promise<string | null> {
  try {
    const url = `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    })
    if (!response.ok) return null
    const html = await response.text()
    const abstracts = extractSearchAbstracts(html, query)
    if (abstracts.length > 0) {
      return shortSummary(abstracts.join(' '), 280)
    }
    return null
  } catch {
    return null
  }
}

export async function searchWithBing(query: string): Promise<string | null> {
  try {
    const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: {
        'user-agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
      }
    })
    if (!response.ok) return null
    const html = await response.text()
    const abstracts = extractSearchAbstracts(html, query)
    if (abstracts.length > 0) {
      return shortSummary(abstracts.join(' '), 280)
    }
    return null
  } catch {
    return null
  }
}

/** 简单清理话题标题，去掉末尾的"?"/"？"、问号，统一标点 */
export function normalizeTopicTitle(title: string): string {
  return title
    .replace(/\?+\s*$/g, '')
    .replace(/？+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** 检测问题类型（用于兜底摘要生成） */
export function detectTopicType(title: string): string {
  if (/^\/+/.test(title)) return '讨论'
  if (/什么|为何|为什么|怎么|哪些|哪里|如何|怎样|是不是/.test(title)) return '提问'
  if (/评价|怎么看|如何看待|怎么看/.test(title)) return '讨论'
  if (/热搜|排行|榜单|第一|夺冠|破|刷新/.test(title)) return '热点'
  if (/宣布|发布|推出|上市|官宣|声明|回应|通报/.test(title)) return '事件'
  if (/去世|逝世|离世|遇难|身亡/.test(title)) return '事件'
  if (/道歉|回应|澄清|辟谣|否认/.test(title)) return '事件'
  if (/价格|涨价|跌|暴跌|上涨|跌至|降|售/.test(title)) return '事件'
  return '话题'
}

/** 当搜索引擎抓不到时，基于标题生成简短的兜底描述 */
export function generateFallbackSummary(title: string, url: string = ''): string {
  const normalized = normalizeTopicTitle(title)
  const type = detectTopicType(normalized)

  // 根据 URL 判断来源平台
  let platform = '网络'
  if (url.includes('zhihu.com')) platform = '知乎'
  else if (url.includes('s.weibo.com')) platform = '微博'
  else if (url.includes('bbs.hupu.com')) platform = '虎扑社区'
  else if (url.includes('mp.weixin.qq.com')) platform = '微信'
  else if (url.includes('douyin.com')) platform = '抖音'
  else if (url.includes('36kr.com')) platform = '36氪'

  return `${platform}热门${type}，详情点击原文查看`
}

/** 生成热榜区块 markdown（提取自 generate-history-daily.ts 的 buildHotSearchSection） */
export async function buildHotSearchSection(): Promise<string> {
  try {
    const topics = await fetchHotTopics(10)
    if (topics.length === 0) {
      return '- 今日热榜数据源暂不可用，后续补充。'
    }

    const items: string[] = []
    for (const topic of topics) {
      // 优先用搜索引擎抓摘要
      let summary = await fetchTopicSummaryWithSearch(topic)

      // 标题带上链接（无链接则保持纯文本）
      const heading = topic.url
        ? `### ${topic.rank}. [${topic.title}](${topic.url})`
        : `### ${topic.rank}. ${topic.title}`

      if (summary) {
        items.push(heading, `- **摘要**：${summary}`, '')
      } else {
        // 搜索引擎抓不到时，基于标题生成简短描述（兜底也要有内容）
        const fallback = generateFallbackSummary(topic.title, topic.url)
        items.push(heading, `- **摘要**：${fallback}`, '')
      }
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
