import { describe, it, expect } from 'vitest'
import { rawFromGlob, stemFromGlobPath } from './useBlogData'

describe('rawFromGlob', () => {
  it('returns string directly', () => {
    expect(rawFromGlob('# hello')).toBe('# hello')
  })

  it('extracts default from module object', () => {
    expect(rawFromGlob({ default: 'content' })).toBe('content')
  })

  it('returns empty string for null', () => {
    expect(rawFromGlob(undefined)).toBe('')
  })

  it('prefers default over other keys', () => {
    expect(rawFromGlob({ default: 'main', extra: 'other' })).toBe('main')
  })
})

describe('stemFromGlobPath', () => {
  it('extracts name from .md path', () => {
    expect(stemFromGlobPath('./assets/blog/test.md', 'md')).toBe('test')
  })

  it('extracts name with Chinese characters', () => {
    expect(stemFromGlobPath('./assets/blog/互联网架构核心概念总结.md', 'md')).toBe('互联网架构核心概念总结')
  })

  it('extracts name from .html path', () => {
    expect(stemFromGlobPath('./assets/blog/html/test.html', 'html')).toBe('test')
  })

  it('returns null for mismatched extension', () => {
    expect(stemFromGlobPath('./assets/blog/test.md', 'html')).toBeNull()
  })

  it('returns null for non-matching pattern', () => {
    expect(stemFromGlobPath('', 'md')).toBeNull()
  })
})
