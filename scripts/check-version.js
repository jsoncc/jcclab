/**
 * 校验 package.json 与 package-lock.json 的项目版本号是否一致。
 * 用于 prebuild 钩子，防止手工改 package.json 版本后 lock 文件未同步导致漂移。
 * 用法：node scripts/check-version.js
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
const lock = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8'))

const v1 = pkg.version
const v2 = lock.version
const v3 = lock.packages?.['']?.version

if (!v3 || v1 !== v2 || v2 !== v3) {
  console.error(`版本不一致：package.json=${v1}，package-lock.json=${v2}，packages.version=${v3 || '缺失'}`)
  console.error('请运行 npm run release:major / release:minor / release 统一版本号')
  process.exit(1)
}
console.log(`版本一致 ✓ v${v1}`)
