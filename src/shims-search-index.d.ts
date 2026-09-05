declare module '*/search-index.json' {
  const docs: Array<{
    id: string
    type: 'blog' | 'tool'
    title: string
    tags: string[]
    category?: string
    body?: string
    module?: string
    path?: string
    action?: string
  }>
  export default docs
}

declare module '*/blog-catalog.json' {
  import type { BlogCatalogItem } from '@/types/blog'
  const items: BlogCatalogItem[]
  export default items
}
