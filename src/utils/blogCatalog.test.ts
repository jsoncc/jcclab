import { describe, expect, it } from 'vitest'
import blogCatalog from '../assets/blog-catalog.json'
import { BLOG_PAGE_SIZE, filterBlogItems, paginateBlogItems } from './blogCatalog'
import type { BlogCatalogItem } from '../types/blog'

const catalog = blogCatalog as BlogCatalogItem[]

describe('博客分类浏览', () => {
  it('筛选仅返回对应主题的文章', () => {
    const items = filterBlogItems(catalog, 'site-engineering')
    expect(items).toHaveLength(6)
    expect(items.every(item => item.category === 'site-engineering')).toBe(true)
  })

  it('分页只作用于当前筛选结果', () => {
    expect(paginateBlogItems(filterBlogItems(catalog, 'ai-agent'), 1)).toHaveLength(10)
    expect(paginateBlogItems(filterBlogItems(catalog, 'site-engineering'), 1)).toHaveLength(6)
    expect(paginateBlogItems(catalog, 4, BLOG_PAGE_SIZE)).toHaveLength(5)
  })
})
