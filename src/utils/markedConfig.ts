/**
 * marked 公共配置：让外链自动在新窗口/标签页打开。
 * 内部锚点（#xxx）保持原样。
 *
 * 使用方法（在 main.ts 或单个调用前）：
 *   import { configureMarked } from '@/utils/markedConfig'
 *   configureMarked()
 */
import { marked, Renderer } from 'marked'

/** 是否已经初始化过（避免重复 setOptions） */
let configured = false

/**
 * 配置 marked 的全局 renderer。
 * - 外链（http/https 开头）：自动加 target="_blank" rel="noopener noreferrer"
 * - 其他链接：保持默认渲染
 */
export function configureMarked(): void {
  if (configured) return
  configured = true

  const renderer = new Renderer()
  const baseLink = renderer.link.bind(renderer)

  renderer.link = (token) => {
    const href = token.href ?? ''
    const title = token.title
    const text = token.text ?? ''

    if (/^https?:\/\//.test(href)) {
      const titleAttr = title ? ` title="${title}"` : ''
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`
    }
    return baseLink(token)
  }

  marked.setOptions({ renderer })
}

export { marked }
