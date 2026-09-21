export type ReadingWidth = 'comfortable' | 'wide'

export const READING_WIDTH_STORAGE_KEY = 'jcclab-blog-reading-width'

export function parseReadingWidth(value: string | null): ReadingWidth {
  return value === 'wide' ? 'wide' : 'comfortable'
}
