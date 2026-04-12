/**
 * 在已执行 `npx wrangler login` 的前提下，为 SITE_STATS 绑定 KV：
 * - 若命名空间不存在则创建；
 * - 若已存在（Cloudflare 报错 10014）则从 `kv namespace list` 读取 id。
 * 并把配置写入 workers/wrangler.toml。
 *
 * 用法：npm run workers:kv-bind
 */
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const workersDir = path.join(root, 'workers')
const tomlPath = path.join(workersDir, 'wrangler.toml')

interface WranglerKvNamespaceRow {
  title?: string
  id?: string
}

/** Wrangler 输出的 id 可能是 32 位 hex 或带横线的 UUID */
function extractIdFromCreateOutput(text: string): string | null {
  const hex32 = text.match(/\b[a-f0-9]{32}\b/i)
  if (hex32) return hex32[0]
  const uuid = text.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)
  return uuid ? uuid[0] : null
}

function fetchExistingSiteStatsId(): string | null {
  const r: SpawnSyncReturns<string> = spawnSync('npx', ['wrangler', 'kv', 'namespace', 'list'], {
    cwd: workersDir,
    encoding: 'utf8',
    shell: true,
    env: process.env
  })
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`
  const i = out.indexOf('[')
  if (i === -1) return null
  try {
    const arr: unknown = JSON.parse(out.slice(i))
    if (!Array.isArray(arr)) return null
    const row = arr.find(
      (x: unknown): x is WranglerKvNamespaceRow =>
        typeof x === 'object' &&
        x !== null &&
        'title' in x &&
        typeof (x as WranglerKvNamespaceRow).title === 'string' &&
        ((x as WranglerKvNamespaceRow).title === 'today-history-baidu-proxy-SITE_STATS' ||
          String((x as WranglerKvNamespaceRow).title).includes('SITE_STATS'))
    )
    return row?.id && typeof row.id === 'string' ? row.id : null
  } catch {
    return null
  }
}

function runKvCreate(preview: boolean): SpawnSyncReturns<string> {
  const args = ['wrangler', 'kv', 'namespace', 'create', 'SITE_STATS']
  if (preview) args.push('--preview')
  return spawnSync('npx', args, {
    cwd: workersDir,
    encoding: 'utf8',
    shell: true,
    env: process.env
  })
}

function readToml(): string {
  return fs.readFileSync(tomlPath, 'utf8')
}

function hasBoundKv(toml: string): boolean {
  return (
    /^\[\[kv_namespaces\]\]\s*$/m.test(toml) &&
    /binding\s*=\s*"SITE_STATS"/m.test(toml) &&
    /^\s*id\s*=\s*"[a-f0-9-]{32,36}"/im.test(toml)
  )
}

function writeTomlWithKv(prodId: string, previewId: string | null): void {
  const previewLine = previewId ? `preview_id = "${previewId}"\n` : ''
  const content = `name = "today-history-baidu-proxy"
main = "site-worker.ts"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SITE_STATS"
id = "${prodId}"
${previewLine}
# 可选：逗号分隔的额外 CORS 来源（默认已含 jsoncc.github.io 与 localhost:3000）
# [vars]
# STATS_ORIGINS = "https://你的自定义域名.com"
`
  fs.writeFileSync(tomlPath, content, 'utf8')
}

function main(): void {
  if (!fs.existsSync(tomlPath)) {
    console.error('未找到 workers/wrangler.toml')
    process.exit(1)
  }

  const toml = readToml()
  if (hasBoundKv(toml)) {
    console.log('wrangler.toml 已存在 SITE_STATS 的 id，跳过。')
    process.exit(0)
  }

  console.log('创建或关联生产 KV 命名空间 SITE_STATS …')
  const prod = runKvCreate(false)
  const prodOut = `${prod.stdout ?? ''}${prod.stderr ?? ''}`
  console.log(prodOut)

  let prodId: string | null = prod.status === 0 ? extractIdFromCreateOutput(prodOut) : null
  const alreadyExists =
    prod.status !== 0 &&
    (/10014|already exists|namespace with this account ID and title already exists/i.test(prodOut) ||
      /already exists/i.test(prodOut))

  if (!prodId && alreadyExists) {
    prodId = fetchExistingSiteStatsId()
    if (prodId) console.log(`\n已找到已有命名空间 id: ${prodId}`)
  }

  if (!prodId) {
    console.error(
      '\n失败：请先 npx wrangler login；若命名空间已存在但仍失败，请手动执行 wrangler kv namespace list 并编辑 wrangler.toml'
    )
    process.exit(prod.status || 1)
  }

  let previewId: string | null = null
  console.log('\n尝试创建 preview KV（本地 wrangler dev，可选）…')
  const prev = runKvCreate(true)
  const prevOut = `${prev.stdout ?? ''}${prev.stderr ?? ''}`
  console.log(prevOut)
  if (prev.status === 0) {
    previewId = extractIdFromCreateOutput(prevOut)
  }

  writeTomlWithKv(prodId, previewId)
  console.log(`\n已写入 ${path.relative(root, tomlPath)}`)
  console.log('下一步：npm run workers:deploy')
}

main()
