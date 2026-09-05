/**
 * vite 插件：构建前自动生成搜索索引
 */
import type { Plugin } from 'vite'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

export default function searchIndexPlugin(): Plugin {
  const script = join(process.cwd(), 'scripts/build-search-index.js')
  const blogDir = join(process.cwd(), 'src/assets/blog')

  /**
   * 搜索索引是被应用源码静态导入的；异步生成会让 dev 首次加载读到旧索引。
   * 因此开发和生产均在 Vite 开始处理模块前同步完成生成。
   */
  const buildIndex = () => {
    if (!existsSync(script)) return
    const res = spawnSync('node', [script], { stdio: 'inherit' })
    if (res.status !== 0) {
      throw new Error(`[search-index] build failed with code ${res.status}`)
    }
  }

  return {
    name: 'build-search-index',
    apply: () => true, // dev 和 build 都跑
    buildStart() {
      buildIndex()
    },
    configureServer(server) {
      // import.meta.glob 的匹配清单在 dev server 启动时生成。新增或删除文章时，
      // 仅 HMR 无法把新文件加入该清单，必须重启 server 后才能正常打开文章。
      let restarting = false
      const refreshBlogFiles = (file: string) => {
        if (restarting || !file.startsWith(blogDir)) return
        restarting = true
        try {
          buildIndex()
          void server.restart()
        } finally {
          restarting = false
        }
      }
      server.watcher.on('add', refreshBlogFiles)
      server.watcher.on('unlink', refreshBlogFiles)
    }
  }
}
