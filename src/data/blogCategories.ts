import definitions from './blog-categories.json'

export type BlogCategoryId =
  | 'ai-agent'
  | 'code-collaboration'
  | 'dev-environment'
  | 'site-engineering'

export interface BlogCategory {
  id: BlogCategoryId
  label: string
  description: string
  icon: string
  color: string
}

export const BLOG_CATEGORIES = definitions as BlogCategory[]

export const getBlogCategory = (id: string): BlogCategory | undefined =>
  BLOG_CATEGORIES.find((category) => category.id === id)
