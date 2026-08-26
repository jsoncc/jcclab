declare module '*/search-index.json' {
  const docs: Array<{
    id: string
    type: 'blog' | 'tool'
    title: string
    tags: string[]
    body?: string
    module?: string
    path?: string
    action?: string
  }>
  export default docs
}
