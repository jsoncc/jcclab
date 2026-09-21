import { describe, expect, it } from 'vitest'
import { renderBlogMarkdown, stripBlogFrontmatter } from './blogMarkdown'

describe('blogMarkdown', () => {
  it('从同一份 Markdown 数据生成标题锚点与目录', () => {
    const result = renderBlogMarkdown([
      '# 文章标题',
      '## 第一节',
      '### 第一节说明',
      '# 历史文章的后续章节',
      '## 子章节'
    ].join('\n\n'))

    expect(result.html).toContain('<h1 id="heading-0">文章标题</h1>')
    expect(result.headings).toEqual([
      { id: 'heading-1', text: '第一节', level: 2 },
      { id: 'heading-2', text: '第一节说明', level: 3 },
      { id: 'heading-3', text: '历史文章的后续章节', level: 2 },
      { id: 'heading-4', text: '子章节', level: 3 }
    ])
  })

  it('识别 Mermaid 围栏且不影响普通代码块', () => {
    const result = renderBlogMarkdown('```mermaid\ngraph LR\nA --> B\n```\n\n```bash\necho ok\n```')
    expect(result.hasMermaid).toBe(true)
    expect(result.html).toContain('<pre class="mermaid">graph LR')
    expect(result.html).toContain('language-bash')
  })

  it('移除 frontmatter，供原文模式安全显示', () => {
    expect(stripBlogFrontmatter('---\ntitle: Test\n---\n\n# 正文')).toBe('# 正文')
  })
})
