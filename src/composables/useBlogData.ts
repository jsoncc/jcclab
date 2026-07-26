import { marked } from 'marked'
import { configureMarked } from '../utils/markedConfig'
import { rawFromGlob } from '../utils/sharedGlob'

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

export function useBlogData() {
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
    getBlogMdContent,
    renderMarkdown
  }
}
