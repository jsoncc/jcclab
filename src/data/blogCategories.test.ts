import { describe, expect, it } from 'vitest'
import blogCatalog from '../assets/blog-catalog.json'
import { BLOG_CATEGORIES, getBlogCategory } from './blogCategories'
import type { BlogCatalogItem } from '../types/blog'

const catalog = blogCatalog as BlogCatalogItem[]

describe('博客分类目录', () => {
  it('定义四个稳定的主题分类', () => {
    expect(BLOG_CATEGORIES.map(category => category.id)).toEqual([
      'ai-agent',
      'code-collaboration',
      'dev-environment',
      'site-engineering'
    ])
  })

  it('每篇文章都有有效分类，且分类数量符合目录约定', () => {
    expect(catalog).toHaveLength(35)
    for (const item of catalog) {
      expect(getBlogCategory(item.category)).toBeDefined()
      expect(item.title).not.toHaveLength(0)
      expect(item.excerpt).not.toHaveLength(0)
    }

    const counts = catalog.reduce<Record<string, number>>((result, item) => {
      result[item.category] = (result[item.category] || 0) + 1
      return result
    }, {})
    expect(counts).toEqual({
      'ai-agent': 10,
      'code-collaboration': 10,
      'dev-environment': 9,
      'site-engineering': 6
    })
  })

  it('将 GPT-5.6 归入 AI 与 Agent，而非按标题前缀推断', () => {
    const gpt = catalog.find(item => item.id === 'GPT-5.6 系列模型价格、能力与选型对比')
    expect(gpt?.category).toBe('ai-agent')
  })
})
