/**
 * 将 src/assets/blog/html/ 中缺少对应 .md 的孤立 HTML 文件还原为 Markdown。
 * 用法：npx tsx scripts/convert-html-to-md.ts
 */
import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import * as cheerio from 'cheerio'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.join(__dirname, '..')
const blogDir = path.join(repoRoot, 'src', 'assets', 'blog')
const htmlDir = path.join(blogDir, 'html')

/* ---------- Turndown 配置 ---------- */
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*'
})

// 启用 GFM 表格支持
turndownService.use(gfm)

/* ---------- 需要转换的 7 个孤立 HTML ---------- */
const ORPHAN_HTML_NAMES = [
  '互联网架构核心概念总结',
  'PDF转图片工具开发记录',
  'OpenCode 常用命令与快捷键完整手册',
  'OpenCode Skills 全局配置完整操作文档',
  'Git 远程仓库配置指南',
  'Git 分支管理命令大全',
  'Git 代码提交与同步指南'
]

/* ---------- 收集 Annotation 参考链接 ---------- */
let noteRefs: { id: string; tip: string }[] = []
let noteCounter = 0

/* ---------- 自定义 class 转 Markdown ---------- */
function convertCustomClasses($: cheerio.CheerioAPI): void {
  // .highlight → blockquote with marker
  $('.highlight').each((_, el) => {
    const $el = $(el)
    // 将内部的 h2/h3 替换为 p><strong> 以避免 blockquote 结构断裂
    $el.find('h2, h3').each((_, heading) => {
      const $heading = $(heading)
      const text = $heading.text()
      $heading.replaceWith(`<p><strong>${text}</strong></p>`)
    })
    const innerHtml = $el.html() || ''
    $el.replaceWith(`<blockquote class="highlight">${innerHtml}</blockquote>`)
  })

  // .warning → blockquote with warning prefix
  $('.warning').each((_, el) => {
    const $el = $(el)
    $el.find('h2, h3').each((_, heading) => {
      const $heading = $(heading)
      const text = $heading.text()
      $heading.replaceWith(`<p><strong>${text}</strong></p>`)
    })
    const innerHtml = $el.html() || ''
    $el.replaceWith(`<blockquote class="warning"><p>⚠️ ${innerHtml}</p></blockquote>`)
  })

  // .success → blockquote with checkmark
  $('.success').each((_, el) => {
    const $el = $(el)
    $el.find('h2, h3').each((_, heading) => {
      const $heading = $(heading)
      const text = $heading.text()
      $heading.replaceWith(`<p><strong>${text}</strong></p>`)
    })
    const innerHtml = $el.html() || ''
    $el.replaceWith(`<blockquote class="success"><p>✅ ${innerHtml}</p></blockquote>`)
  })

  // .annotation → 参考式链接，收集到 noteRefs
  $('.annotation').each((_, el) => {
    const $el = $(el)
    const tip = $el.attr('data-tip') || ''
    const text = $el.text()
    noteCounter++
    const noteId = `note-${noteCounter}`
    noteRefs.push({ id: noteId, tip })
    $el.replaceWith(`<span class="annotation-ref" data-note="${noteId}">${text}</span>`)
  })
}

/* ---------- 提取 body 内容 ---------- */
function extractBodyContent(html: string): string {
  const $ = cheerio.load(html)

  // 转换自定义 class 为 Markdown 格式
  convertCustomClasses($)

  // 获取 body 内容
  const bodyContent = $('body').html() || ''

  // 移除内联 style 标签（不需要样式）
  const cleaned = bodyContent.replace(/<style[\s\S]*?<\/style>/gi, '')

  return cleaned
}

/* ---------- 后处理 Markdown：添加 blockquote 类型标记 ---------- */
function addBlockquoteMarkers(markdown: string): string {
  const lines = markdown.split('\n')
  const result: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 检测 ⚠️ 或 ✅ 出现在 blockquote 中（包括嵌套 > > ⚠️ 或 > > ✅）
    if (/^>\s*(>\s*)?⚠️/.test(line)) {
      result.push('<!-- warning-start -->')
      result.push(line)
    } else if (/^>\s*(>\s*)?✅/.test(line)) {
      result.push('<!-- success-start -->')
      result.push(line)
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}

/* ---------- 单文件转换 ---------- */
function convertFile(htmlName: string): void {
  const htmlPath = path.join(htmlDir, `${htmlName}.html`)
  if (!fs.existsSync(htmlPath)) {
    console.error(`[skip] not found: ${htmlPath}`)
    return
  }

  // 检查是否已有对应的 .md 文件
  const mdPath = path.join(blogDir, `${htmlName}.md`)
  if (fs.existsSync(mdPath)) {
    console.log(`[skip] already exists: ${mdPath}`)
    return
  }

  console.log(`[converting] ${htmlName}.html`)

  // 重置 noteRefs
  noteRefs = []
  noteCounter = 0

  // 读取 HTML 内容
  const html = fs.readFileSync(htmlPath, 'utf8')

  // 提取 body 内容
  const bodyHtml = extractBodyContent(html)

  // 用 Turndown 转换为 Markdown
  let markdown = turndownService.turndown(bodyHtml)

  // 后处理：添加 blockquote 类型标记
  markdown = addBlockquoteMarkers(markdown)

  // 添加参考链接
  if (noteRefs.length > 0) {
    markdown += '\n\n---\n\n'
    for (const ref of noteRefs) {
      markdown += `[${ref.id}]: ${ref.tip}\n`
    }
  }

  // 清理多余空行（保留最多 2 个连续空行）
  markdown = markdown.replace(/\n{3,}/g, '\n\n')

  // 清理行首行尾空格
  markdown = markdown.split('\n').map(line => line.trimEnd()).join('\n')

  // 确保文件以换行符结尾
  if (!markdown.endsWith('\n')) {
    markdown += '\n'
  }

  // 写入 .md 文件
  fs.writeFileSync(mdPath, markdown, 'utf8')
  console.log(`[ok] ${mdPath}`)
}

/* ---------- 批量转换 ---------- */
function convertAll(): void {
  for (const htmlName of ORPHAN_HTML_NAMES) {
    convertFile(htmlName)
  }
}

/* ---------- 入口 ---------- */
const targetFile = process.argv[2]
if (targetFile) {
  // 单文件模式：npx tsx scripts/convert-html-to-md.ts "互联网架构核心概念总结"
  convertFile(targetFile)
} else {
  // 批量模式
  convertAll()
}
