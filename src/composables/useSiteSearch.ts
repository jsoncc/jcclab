/**
 * 站内全文搜索 composable
 * 用 MiniSearch 实现客户端搜索，支持中文（按字切分）
 */
import { ref, computed } from 'vue'
import MiniSearch from 'minisearch'
import indexData from '@/assets/search-index.json'

// 预处理 tokenize：对中文按字拆，对英文按词拆
function tokenize(text: string): string[] {
  if (!text) return []
  const tokens: string[] = []
  // 英文/数字按空格拆
  const words = text.toLowerCase().split(/[\s\p{P}]+/u).filter(Boolean)
  tokens.push(...words)
  // 中文按字拆（每 1-2 字为一个 token，提高中文搜索召回率）
  const chineseStr = text.replace(/[a-zA-Z0-9\s\p{P}]/gu, '')
  for (let i = 0; i < chineseStr.length; i++) {
    tokens.push(chineseStr[i])
    if (i < chineseStr.length - 1) tokens.push(chineseStr.slice(i, i + 2))
  }
  return tokens
}

// 初始化 MiniSearch
const ms = new MiniSearch({
  fields: ['title', 'body', 'tags'],
  storeFields: ['title', 'type', 'module', 'path', 'action'],
  tokenize,
  processTerm: (term) => (term ? term.toLowerCase() : null)
})
ms.addAll(indexData as any[])

const keyword = ref('')
const activeIndex = ref(0)

const results = computed(() => {
  const kw = keyword.value.trim()
  if (!kw) return [] as any[]
  return ms.search(kw, {
    fuzzy: 0.2,
    prefix: true,
    boost: { title: 3, tags: 2 }
  })
})

// 按类型分组
const groupedResults = computed(() => {
  const groups: Record<string, any[]> = { blog: [], tool: [] }
  for (const r of results.value) {
    const type = (r as any).type || 'blog'
    if (!groups[type]) groups[type] = []
    groups[type].push(r)
  }
  return groups
})

// 高亮关键词
function highlight(text: string, kw: string): string {
  if (!kw || !text) return text
  const safeKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(safeKw, 'gi'), (m) => `<mark>${m}</mark>`)
}

export function useSiteSearch() {
  return {
    keyword,
    results,
    groupedResults,
    activeIndex,
    highlight
  }
}
