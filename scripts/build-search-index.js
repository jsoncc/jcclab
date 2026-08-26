/**
 * 构建博客全文搜索索引
 * 在 vite build 时自动执行，扫描 src/assets/blog/ 下所有 md 文件
 * 输出到 src/assets/search-index.json
 */
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const BLOG_DIR = join(ROOT, 'src/assets/blog')
const OUT_FILE = join(ROOT, 'src/assets/search-index.json')

// 工具候选池（与 App.vue headerSearchCandidates 中的工具保持一致）
const TOOLS = [
  { id: 'tool-json', title: 'JSON 格式化校验', meta: '工具集合', type: 'tool',
    tags: ['json', '格式化', '校验'], action: 'tool:formatCheck' },
  { id: 'tool-uuid', title: 'UUID 在线生成', meta: '工具集合', type: 'tool',
    tags: ['uuid', '生成', '工具'], action: 'tool:uuid' },
  { id: 'tool-mybatis', title: 'MyBatis SQL日志格式化', meta: '工具集合', type: 'tool',
    tags: ['mybatis', 'sql', '日志', '工具'], action: 'tool:mybatisSql' },
  { id: 'tool-base64', title: '在线 Base64 编解码工具', meta: '工具集合', type: 'tool',
    tags: ['base64', '解码', '编码', '工具'], action: 'tool:base64Decode' },
  { id: 'tool-base64-file', title: 'Base64 转文件', meta: '工具集合', type: 'tool',
    tags: ['base64', '文件', '转文件', '工具'], action: 'tool:base64File' },
  { id: 'tool-pdf', title: 'PDF 转换（转图片 / 转 Word）', meta: '工具集合', type: 'tool',
    tags: ['pdf', '转图片', '转 word', '工具'], action: 'tool:pdfTools' }
]

/**
 * 清理 markdown 文本，提取适合搜索的纯文本
 */
function cleanMarkdown(text) {
  return text
    // 移除代码块
    .replace(/```[\s\S]*?```/g, ' ')
    // 移除行内代码
    .replace(/`[^`]*`/g, ' ')
    // 移除图片
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    // 移除链接保留文字
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    // 移除标题符号
    .replace(/^#+\s+/gm, '')
    // 移除引用
    .replace(/^>\s*/gm, '')
    // 移除列表符号
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // 移除表格分隔
    .replace(/^\|[\s\-:|]+\|$/gm, '')
    // 移除表格中的竖线
    .replace(/\|/g, ' ')
    // 移除粗体斜体标记
    .replace(/[*_~]+/g, '')
    // 压缩空白
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * 处理单篇博客
 */
function processBlog(filename) {
  const fullPath = join(BLOG_DIR, filename)
  if (!existsSync(fullPath)) return null
  const raw = readFileSync(fullPath, 'utf-8')
  // 解析 frontmatter，失败时用空数据 + 整篇作为 body
  let data = {}
  let content = raw
  try {
    const parsed = matter(raw)
    data = parsed.data || {}
    content = parsed.content || raw
  } catch (e) {
    // frontmatter 解析失败时回退：把整篇作为 body
    console.warn(`[search-index] frontmatter parse failed for ${filename}, fallback to raw`)
    content = raw.replace(/^---[\s\S]*?---\n?/, '')
  }
  const id = filename.replace(/\.md$/, '')
  return {
    id,
    type: 'blog',
    title: data.title || id,
    tags: data.tags || [],
    body: cleanMarkdown(content).slice(0, 5000),
    module: 'blog',
    path: id
  }
}

/**
 * 主函数
 */
function buildIndex() {
  if (!existsSync(BLOG_DIR)) {
    console.warn(`[search-index] blog dir not found: ${BLOG_DIR}`)
    return
  }
  const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
  const blogs = files.map(processBlog).filter(Boolean)

  const allDocs = [...blogs, ...TOOLS]
  writeFileSync(OUT_FILE, JSON.stringify(allDocs), 'utf-8')
  console.log(`[search-index] built ${allDocs.length} docs (${blogs.length} blogs + ${TOOLS.length} tools) -> ${OUT_FILE}`)
}

buildIndex()
