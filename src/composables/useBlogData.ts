import { marked } from '../utils/markedConfig'
import { rawFromGlob } from '../utils/sharedGlob'
import blogCatalog from '../assets/blog-catalog.json'
import type { BlogCatalogItem } from '../types/blog'

type GlobRawModule = string | { default: string }
type RawMdMap = Record<string, GlobRawModule>

const blogFiles = import.meta.glob('../assets/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as RawMdMap

export function useBlogData() {
  const catalog = blogCatalog as BlogCatalogItem[]
  const getBlogMdContent = (name: string): string | null => {
    const targetPath = `../assets/blog/${name}.md`
    const mod = blogFiles[targetPath]
    if (!mod) return null
    return rawFromGlob(mod)
  }

  /**
   * 兼容旧版链接：过去曾用 "空格 → -" 生成 slug。
   * 不能通过把 slug 中所有 - 替换为空格来还原，因为文章原名也可能包含 -
   * （例如 GPT-5.6）。改为用已有文件名反向比对，只有唯一的真实文件名才会命中。
   */
  const getBlogNameFromLegacySlug = (slug: string): string | null => {
    const prefix = '../assets/blog/'
    for (const path of Object.keys(blogFiles)) {
      if (!path.startsWith(prefix) || !path.endsWith('.md')) continue
      const name = path.slice(prefix.length, -'.md'.length)
      if (name.replace(/\s+/g, '-') === slug) return name
    }
    return null
  }

  const getBlogCatalogItem = (id: string): BlogCatalogItem | null =>
    catalog.find((item) => item.id === id) || null

  const renderMarkdown = (mdText: string): string => {
    const cleaned = mdText.replace(/^---[\s\S]*?---\s*/, '')
    return String(marked.parse(cleaned))
  }

  return {
    blogFiles,
    getBlogMdContent,
    getBlogNameFromLegacySlug,
    getBlogCatalogItem,
    renderMarkdown
  }
}
