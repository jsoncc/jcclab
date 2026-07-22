import { computed } from 'vue'
import { marked } from 'marked'
import { configureMarked } from '../utils/markedConfig'
import blogMeta from '../assets/blog/blog-meta.json'

configureMarked()

type GlobRawModule = string | { default: string }
type RawMdMap = Record<string, GlobRawModule>

export const rawFromGlob = (mod: GlobRawModule | undefined): string => {
  if (mod == null) return ''
  if (typeof mod === 'string') return mod
  return mod.default ?? ''
}

export const stemFromGlobPath = (globKey: string, ext: string): string | null => {
  const escaped = ext.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = globKey.match(new RegExp(`/([^/]+)\\.${escaped}$`))
  return m ? m[1] : null
}

const blogFiles = import.meta.glob('../assets/blog/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as RawMdMap

const blogMetaMap = blogMeta as Record<string, number>

export type BlogListItem = { name: string; path: string; updatedAt: number }

export function useBlogData() {
  const blogList = computed((): BlogListItem[] => {
    return Object.keys(blogFiles)
      .map((path) => {
        const name = stemFromGlobPath(path, 'md')
        if (!name) return null
        const metaKey = `./assets/blog/${name}.md`
        return { name, path, updatedAt: Number(blogMetaMap[metaKey] || 0) }
      })
      .filter((item): item is BlogListItem => item !== null)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  })

  const getBlogMdContent = (name: string): string | null => {
    const targetPath = `../assets/blog/${name}.md`
    const mod = blogFiles[targetPath]
    if (!mod) return null
    return rawFromGlob(mod)
  }

  const renderMarkdown = (mdText: string): string => {
    const cleaned = mdText.replace(/^---[\s\S]*?---\s*/, '')
    return String(marked.parse(cleaned))
  }

  return {
    blogFiles,
    blogList,
    getBlogMdContent,
    renderMarkdown
  }
}
