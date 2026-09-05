import type { BlogCategoryId } from '@/data/blogCategories'
import type { BlogCatalogItem } from '@/types/blog'

export const BLOG_PAGE_SIZE = 10

export const filterBlogItems = (
  items: BlogCatalogItem[],
  category: BlogCategoryId | 'all'
): BlogCatalogItem[] => category === 'all'
  ? items
  : items.filter(item => item.category === category)

export const paginateBlogItems = <T>(items: T[], page: number, pageSize = BLOG_PAGE_SIZE): T[] => {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}
