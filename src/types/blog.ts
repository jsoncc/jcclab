import type { BlogCategoryId } from '@/data/blogCategories'

export interface BlogCatalogItem {
  id: string
  title: string
  path: string
  category: BlogCategoryId
  tags: string[]
  excerpt: string
}
