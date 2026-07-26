import { marked } from 'marked'
import { configureMarked } from '../utils/markedConfig'
import { rawFromGlob } from '../utils/sharedGlob'

configureMarked()

type GlobRawModule = string | { default: string }
type RawMdMap = Record<string, GlobRawModule>

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
