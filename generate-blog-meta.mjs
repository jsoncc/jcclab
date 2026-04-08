import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = __dirname
const blogDir = path.join(repoRoot, 'src', 'assets', 'blog')
const outputPath = path.join(blogDir, 'blog-meta.json')

const toPosix = (p) => p.split(path.sep).join('/')

const getGitUpdatedAt = (absoluteFilePath) => {
  try {
    const relativePath = toPosix(path.relative(repoRoot, absoluteFilePath))
    const output = execSync(`git log -1 --format=%ct -- "${relativePath}"`, {
      cwd: repoRoot,
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .trim()
    const ts = Number(output)
    if (Number.isFinite(ts) && ts > 0) return ts
  } catch {
    // ignore and fallback to fs mtime
  }

  const stat = fs.statSync(absoluteFilePath)
  return Math.floor(stat.mtimeMs / 1000)
}

const buildBlogMeta = () => {
  if (!fs.existsSync(blogDir)) {
    throw new Error(`Blog directory not found: ${blogDir}`)
  }

  const files = fs
    .readdirSync(blogDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const absolutePath = path.join(blogDir, entry.name)
      return {
        path: `./assets/blog/${entry.name}`,
        updatedAt: getGitUpdatedAt(absolutePath)
      }
    })

  const byPath = Object.fromEntries(files.map((item) => [item.path, item.updatedAt]))
  fs.writeFileSync(outputPath, `${JSON.stringify(byPath, null, 2)}\n`, 'utf8')
}

buildBlogMeta()
