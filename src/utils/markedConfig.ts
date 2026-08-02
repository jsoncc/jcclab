/**
 * marked 公共配置（实例模式）：
 * - 集成 highlight.js 语法高亮（通过 marked-highlight 桥接）
 * - 外链（http/https 开头）自动加 target="_blank" rel="noopener noreferrer"
 * - 内部锚点（#xxx）保持原样
 *
 * 使用方法：
 *   import { marked } from '@/utils/markedConfig'
 *   const html = marked.parse(mdText)  // 同步解析
 */
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'

// ══════════════════════════════════════════════════════════════════
// 1. 实例化 marked + 集成 highlight.js 语法高亮
// ══════════════════════════════════════════════════════════════════
const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      // 未指定语言或未注册 → 自动检测语言语法高亮
      if (code.trim()) {
        const result = hljs.highlightAuto(code)
        return result.value
      }
      return code
    }
  })
)

// ══════════════════════════════════════════════════════════════════
// 2. 使用扩展 API 覆盖 link 渲染（外链 _blank，内链保持默认）
//    return false → 回退到 marked 内置渲染，避免 renderer.parser 未初始化
// ══════════════════════════════════════════════════════════════════
marked.use({
  renderer: {
    link(token) {
      const href = token.href ?? ''
      const title = token.title
      const text = token.text ?? ''

      if (/^https?:\/\//.test(href)) {
        const titleAttr = title ? ` title="${title}"` : ''
        return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`
      }
      return false // fallback to default renderer
    }
  }
})

/** 兼容旧 API：无操作（保留调用入口，避免破坏现有导入） */
export function configureMarked(): void {
  // 实例模式无需全局配置，保留此函数仅为兼容性
}

export { marked }
