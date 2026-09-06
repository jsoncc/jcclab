import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, relative, basename, extname } from 'node:path'
import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import { execFileSync } from 'node:child_process'

const root = process.cwd(), sourceBlog = 'D:/Administrator/Notes/blog', sourceImages = 'D:/Administrator/Notes/images'
const targetBlog = join(root, 'src/assets/blog'), targetImages = join(root, 'src/assets/images/blog'), statePath = join(root, '.blog-sync-state.json')
const dryRun = process.argv.includes('--dry-run'), skipBuild = process.argv.includes('--skip-build')
const categories = new Set(['ai-agent', 'code-collaboration', 'dev-environment', 'site-engineering'])
const listFiles = (dir, ext) => readdirSync(dir, { withFileTypes: true }).flatMap(e => { const p = join(dir, e.name); return e.isDirectory() ? listFiles(p, ext) : (!ext || e.name.toLowerCase().endsWith(ext) ? [relative(dir, p).replaceAll('\\', '/')] : []) })
const hash = value => createHash('sha256').update(value).digest('hex')
const read = p => readFileSync(p, 'utf8')
const write = (p, value) => { if (!dryRun) { mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, value, 'utf8') } }
function categoryFor(name) { if (/^(GPT|ChatGPT|DeepSeek|Hermes|OpenCode|opencode)/.test(name)) return 'ai-agent'; if (/^(Git|GitHub|GIT_)/.test(name)) return 'code-collaboration'; return 'dev-environment' }
const sanitizeYaml = raw => raw.replace(/(^|\n)title:\s*>\s*([^\n]+)/, '$1title: "$2"')
function toTarget(raw, name) { const p = matter(sanitizeYaml(raw)), data = { ...p.data }; if (!categories.has(String(data.category || ''))) data.category = categoryFor(name); const body = p.content.replace(/!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, image, alt) => `![${alt || basename(image, extname(image))}](images/blog/${image.trim()})`); return matter.stringify(body, data) }
function toSource(raw) { const p = matter(sanitizeYaml(raw)), data = { ...p.data }, reverse = { 'ai-agent': '模型与开发工具', 'code-collaboration': '代码协作', 'dev-environment': '开发环境与效率工具', 'site-engineering': '站点工程与自动化' }; if (reverse[data.category]) data.category = reverse[data.category]; const body = p.content.replace(/!\[([^\]]*)\]\(images\/blog\/([^\)]+)\)/g, (_, alt, image) => `![[${image}${alt && alt !== basename(image, extname(image)) ? `|${alt}` : ''}]]`); return matter.stringify(body, data) }
for (const d of [sourceBlog, sourceImages, targetBlog, targetImages]) if (!existsSync(d)) throw new Error(`Directory not found: ${d}`)
const state = existsSync(statePath) ? JSON.parse(read(statePath)) : { version: 1, files: {}, images: {} }, changes = [], conflicts = [], targetOnly = []
const sourceNames = new Set(listFiles(sourceBlog, '.md')), targetNames = new Set(listFiles(targetBlog, '.md'))
for (const name of targetNames) if (!sourceNames.has(name)) targetOnly.push(name)
const bootstrap = Object.keys(state.files).length === 0
if (bootstrap) for (const name of sourceNames) { const sp = join(sourceBlog, name), tp = join(targetBlog, name); if (existsSync(tp)) state.files[name] = { sourceHash: hash(read(sp)), targetHash: hash(read(tp)) } }
for (const name of new Set([...sourceNames, ...targetNames])) { const sp = join(sourceBlog, name), tp = join(targetBlog, name), s = existsSync(sp) ? read(sp) : null; let t = existsSync(tp) ? read(tp) : null; if (s == null) continue; const old = state.files[name] || {}, sc = !old.sourceHash || hash(s) !== old.sourceHash, tc = t != null && (!old.targetHash || hash(t) !== old.targetHash); if (!old.sourceHash && t != null && hash(toTarget(s, name)) === hash(t)) { state.files[name] = { sourceHash: hash(s), targetHash: hash(t) }; continue } if (sc && tc) { conflicts.push(name); continue } const forward = t == null || sc; if (forward) { const out = toTarget(s, name); if (hash(out) !== hash(t || '')) { changes.push(`Obsidian -> jcclab: ${name}`); write(tp, out) } t = out } else if (tc) { const out = toSource(t); changes.push(`jcclab -> Obsidian: ${name}`); write(sp, out); state.files[name] = { sourceHash: hash(out), targetHash: hash(t) }; continue } state.files[name] = { sourceHash: hash(s), targetHash: hash(t) } }
for (const name of listFiles(sourceImages)) { if (!/\.(png|jpe?g|gif|webp|svg)$/i.test(name)) continue; const sp = join(sourceImages, name), tp = join(targetImages, basename(name)), s = read(sp), t = existsSync(tp) ? read(tp) : null, old = state.images[name] || {}, sc = !old.sourceHash || hash(s) !== old.sourceHash, tc = t != null && (!old.targetHash || hash(t) !== old.targetHash); if (!old.sourceHash && t != null && hash(s) === hash(t)) { state.images[name] = { sourceHash: hash(s), targetHash: hash(t) }; continue } if (sc && tc) { conflicts.push(`image:${name}`); continue } if (sc || t == null) { changes.push(`Obsidian -> jcclab image: ${name}`); write(tp, s); state.images[name] = { sourceHash: hash(s), targetHash: hash(s) } } else state.images[name] = { sourceHash: hash(s), targetHash: hash(t) } }
console.log(`Detected ${changes.length} change(s).`); changes.forEach(x => console.log(`- ${x}`)); if (targetOnly.length) { console.log('Target-only Markdown files (kept, not deleted):'); targetOnly.forEach(x => console.log(`- ${x}`)) }; if (conflicts.length) { console.log('Conflicts detected; no conflicting files were overwritten:'); conflicts.forEach(x => console.log(`- ${x}`)); process.exitCode = 2 }
if (dryRun || conflicts.length) { if (dryRun) console.log('Dry-run: directories were not modified.'); process.exit(process.exitCode || 0) }
writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8'); console.log('Synchronization baseline updated.'); if (!skipBuild) execFileSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true })
