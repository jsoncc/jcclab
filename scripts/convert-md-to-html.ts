/**
 * 将 src/assets/blog 下的 .md 文件转为独立 HTML 文件，输出到 src/assets/blog/html/。
 * 用法：npx tsx scripts/convert-md-to-html.ts
 */
import { marked } from 'marked'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.join(__dirname, '..')
const blogDir = path.join(repoRoot, 'src', 'assets', 'blog')
const outputDir = path.join(blogDir, 'html')

const HTML_CSS = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.7;
  color: #1f2328;
  background: #fff;
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 32px 80px;
}

h1 {
  font-size: 2em;
  font-weight: 600;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d0d7de;
  color: #1f2328;
}

h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin: 24px 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #d0d7de;
  color: #1f2328;
}

h3 {
  font-size: 1.25em;
  font-weight: 600;
  margin: 20px 0 8px;
  color: #1f2328;
}

h4 {
  font-size: 1em;
  font-weight: 600;
  margin: 16px 0 8px;
  color: #1f2328;
}

p {
  margin: 0 0 16px;
}

a {
  color: #0969da;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

strong {
  font-weight: 600;
}

ul, ol {
  padding-left: 2em;
  margin: 0 0 16px;
}

li {
  margin: 4px 0;
}

li > ul, li > ol {
  margin: 4px 0 0;
}

blockquote {
  margin: 0 0 16px;
  padding: 8px 16px;
  color: #656d76;
  border-left: 4px solid #d0d7de;
  background: #f6f8fa;
  border-radius: 0 4px 4px 0;
}

blockquote > :last-child {
  margin-bottom: 0;
}

code {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.875em;
  padding: 2px 6px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 4px;
  color: #1f2328;
}

pre {
  margin: 0 0 16px;
  padding: 16px;
  background: #f6f8fa;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow-x: auto;
  line-height: 1.5;
}

pre code {
  padding: 0;
  background: none;
  border: none;
  font-size: 0.85em;
  color: #1f2328;
}

table {
  width: 100%;
  margin: 0 0 16px;
  border-collapse: collapse;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  overflow: hidden;
}

thead {
  background: #f6f8fa;
}

th, td {
  padding: 8px 14px;
  text-align: left;
  border: 1px solid #d0d7de;
  font-size: 0.95em;
}

th {
  font-weight: 600;
}

tr:nth-child(even) {
  background: #f6f8fa;
}

hr {
  margin: 24px 0;
  border: none;
  border-top: 1px solid #d0d7de;
}

img {
  max-width: 100%;
  height: auto;
}
`

/* ---------- 单文件转换 ---------- */
const convertFile = (mdPath: string): void => {
  if (!fs.existsSync(mdPath)) {
    console.error(`[skip] not found: ${mdPath}`)
    return
  }

  const mdContent = fs.readFileSync(mdPath, 'utf8')
  const cleaned = mdContent.replace(/^---[\s\S]*?---\s*/, '')
  const htmlBody = marked.parse(cleaned) as string
  const baseName = path.basename(mdPath, '.md')

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${baseName}</title>
<style>${HTML_CSS}</style>
</head>
<body>
${htmlBody}
</body>
</html>
`

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outPath = path.join(outputDir, `${baseName}.html`)
  fs.writeFileSync(outPath, html, 'utf8')
  console.log(`[ok] ${outPath}`)
}

/* ---------- 批量转换 ---------- */
const convertAll = (): void => {
  const entries = fs.readdirSync(blogDir, { withFileTypes: true })
  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => path.join(blogDir, e.name))

  if (mdFiles.length === 0) {
    console.log('No .md files found in blog directory.')
    return
  }

  for (const file of mdFiles) {
    convertFile(file)
  }
}

/* ---------- 入口 ---------- */
const targetFile = process.argv[2]
if (targetFile) {
  // 单文件模式：npx tsx scripts/convert-md-to-html.ts "OpenCode ...md"
  const fullPath = path.resolve(blogDir, targetFile)
  convertFile(fullPath)
} else {
  // 批量模式
  convertAll()
}
