import type { Renderer, Token } from 'marked'
import { marked } from './markedConfig'

export interface BlogHeading {
  id: string
  text: string
  /** Directory indentation level after normalizing legacy heading structures. */
  level: number
}

export interface BlogMarkdownRenderResult {
  html: string
  headings: BlogHeading[]
  hasMermaid: boolean
}

export function stripBlogFrontmatter(markdown: string): string {
  return markdown.replace(/^---[\s\S]*?---\s*/, '')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function containsMermaid(tokens: readonly Token[]): boolean {
  return tokens.some((token) => {
    if (token.type === 'code' && token.lang?.trim().toLowerCase() === 'mermaid') return true
    const children = 'tokens' in token ? token.tokens : undefined
    return Array.isArray(children) && containsMermaid(children as Token[])
  })
}

/**
 * Render article content and derive its table of contents in the same pass.
 * The first h1 is the article title; later h1 values are retained as sections
 * so legacy documents with multiple h1 headings remain navigable.
 */
export function renderBlogMarkdown(markdown: string): BlogMarkdownRenderResult {
  const content = stripBlogFrontmatter(markdown)
  const tokens = marked.lexer(content)
  const headings: BlogHeading[] = []
  let headingIndex = 0
  let firstH1Seen = false
  let nestedUnderSectionH1 = false
  // Clone the configured renderer so marked-highlight and external-link
  // handling remain active while only headings and Mermaid code are customized.
  const configuredRenderer = marked.defaults.renderer
  if (!configuredRenderer) throw new Error('Marked renderer is not configured')
  const renderer = Object.create(configuredRenderer) as Renderer
  const defaultCode = renderer.code

  renderer.heading = function heading(token) {
    const id = `heading-${headingIndex++}`
    const isTitle = token.depth === 1 && !firstH1Seen
    if (token.depth === 1) {
      firstH1Seen = true
      nestedUnderSectionH1 = !isTitle
    }

    if (!isTitle) {
      const level = token.depth === 1
        ? 2
        : token.depth + (nestedUnderSectionH1 ? 1 : 0)
      headings.push({ id, text: token.text, level })
    }

    return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>\n`
  }
  renderer.code = function code(token) {
    if (token.lang?.trim().toLowerCase() === 'mermaid') {
      return `<pre class="mermaid">${escapeHtml(token.text)}</pre>\n`
    }
    return defaultCode.call(this, token)
  }

  const html = String(marked.parse(content, { renderer }))

  return { html, headings, hasMermaid: containsMermaid(tokens) }
}
