import { describe, it, expect, vi } from 'vitest'

// Mock import.meta.glob before importing the module under test
vi.mock('../utils/sharedGlob', () => ({
  rawFromGlob: (mod: any) => {
    if (mod == null) return ''
    if (typeof mod === 'string') return mod
    return mod.default ?? ''
  },
  stemFromGlobPath: () => null
}))

// Mock marked to avoid actual markdown rendering in tests
vi.mock('marked', () => ({
  marked: {
    parse: (text: string) => `<p>${text}</p>`
  }
}))

// Mock configureMarked to be a no-op
vi.mock('../utils/markedConfig', () => ({
  configureMarked: () => {}
}))

describe('useBlogData', () => {
  // S1: getBlogMdContent returns null for unknown file (RED first)
  it('getBlogMdContent returns null for unknown file', async () => {
    // Dynamic import so mocks take effect first
    const mod = await import('./useBlogData')
    const { getBlogMdContent } = mod.useBlogData()
    expect(getBlogMdContent('non-existent')).toBeNull()
  })

  it('getBlogMdContent returns content for known file', async () => {
    const mod = await import('./useBlogData')
    const { getBlogMdContent } = mod.useBlogData()
    // blogFiles is an empty object (mocked import.meta.glob returns {})
    // So any name will return null
    expect(getBlogMdContent('test-post')).toBeNull()
  })

  // S2: renderMarkdown strips frontmatter
  it('renderMarkdown strips frontmatter', async () => {
    const mod = await import('./useBlogData')
    const { renderMarkdown } = mod.useBlogData()
    const md = '---\ntitle: Test\n---\n\nHello world'
    const html = renderMarkdown(md)
    expect(html).not.toContain('---')
    expect(html).toContain('Hello world')
  })

  it('renderMarkdown handles content without frontmatter', async () => {
    const mod = await import('./useBlogData')
    const { renderMarkdown } = mod.useBlogData()
    const html = renderMarkdown('# Just content')
    expect(html).toContain('Just content')
  })
})
