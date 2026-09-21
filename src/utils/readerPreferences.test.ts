import { describe, expect, it } from 'vitest'
import { parseReadingWidth } from './readerPreferences'

describe('readerPreferences', () => {
  it('仅接受受支持的阅读宽度，并回退到舒适模式', () => {
    expect(parseReadingWidth('wide')).toBe('wide')
    expect(parseReadingWidth('comfortable')).toBe('comfortable')
    expect(parseReadingWidth(null)).toBe('comfortable')
    expect(parseReadingWidth('unexpected')).toBe('comfortable')
  })
})
