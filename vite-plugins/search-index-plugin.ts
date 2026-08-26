/**
 * vite 插件：构建前自动生成搜索索引
 */
import type { Plugin } from 'vite'
import { spawnSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export default function searchIndexPlugin(): Plugin {
  return {
    name: 'build-search-index',
    apply: () => true, // dev 和 build 都跑
    buildStart() {
      const script = join(process.cwd(), 'scripts/build-search-index.js')
      if (!existsSync(script)) return
      // build 模式同步跑（确保索引先生成），dev 模式异步跑
      const isBuild = process.env.NODE_ENV === 'production'
      if (isBuild) {
        const res = spawnSync('node', [script], { stdio: 'inherit' })
        if (res.status !== 0) {
          throw new Error(`[search-index] build failed with code ${res.status}`)
        }
      } else {
        const child = spawn('node', [script], { stdio: 'inherit' })
        child.on('error', (e) => console.warn('[search-index-plugin] dev index build error:', e))
      }
    }
  }
}
