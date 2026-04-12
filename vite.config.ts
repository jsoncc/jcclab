/**
 * Vite 配置：base 为相对路径以适配 GitHub Pages 子目录；
 * 开发/预览时把 /baidu-fanyi 代理到百度翻译，避免本地跨域。
 */
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Socket } from 'node:net'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

type ProxyWithError = {
  on(
    event: 'error',
    listener: (err: Error, req: IncomingMessage, res: ServerResponse | Socket) => void
  ): void
}

const baiduTranslateProxy = {
  '/baidu-fanyi': {
    target: 'https://fanyi-api.baidu.com',
    changeOrigin: true,
    rewrite: () => '/api/trans/vip/translate'
  },
  /** 本地联调：须另开终端执行 `npm run workers:dev`（默认 8787），否则代理会连不上 */
  '/site-stats': {
    target: 'http://127.0.0.1:8787',
    changeOrigin: true,
    rewrite: () => '/stats',
    configure(proxy: ProxyWithError) {
      // Wrangler 未启动时避免未捕获代理错误把 dev server 打成 500，改为可读 503 提示
      proxy.on('error', (err, _req, res) => {
        type MaybeRes = {
          headersSent?: boolean
          writeHead?: (code: number, headers: Record<string, string>) => void
          end?: (chunk: string) => void
        }
        const r = res as MaybeRes | undefined
        if (!r?.writeHead || !r.end || r.headersSent) return
        r.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
        r.end(
          '未连接到 127.0.0.1:8787。请另开终端在项目根执行: npm run workers:dev\n' +
            `(${err instanceof Error ? err.message : String(err)})`
        )
      })
    }
  }
}

export default defineConfig({
  plugins: [vue()],
  base: './',
  server: {
    port: 3000,
    open: true,
    proxy: baiduTranslateProxy
  },
  preview: {
    proxy: baiduTranslateProxy
  }
})
