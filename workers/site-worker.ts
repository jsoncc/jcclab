/**
 * Cloudflare Worker 入口：
 * - GET /stats：总 PV/UV（KV），CORS + Cookie 访客标记
 *
 * 翻译已迁移至腾讯云 SCF：由 SCF 保存百度密钥并在服务端签名。
 *
 * 部署：项目根执行 npx wrangler login 后 npm run workers:deploy
 * Worker 根 URL 写入 VITE_SITE_STATS_URL；前端会补全 /stats。
 */
import { handleStats, type StatsEnv } from './stats'

export interface Env extends StatsEnv {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/$/, '') || '/'

    if (path === '/stats') {
      return handleStats(request, env)
    }

    return new Response('Translation endpoint has moved to Tencent Cloud SCF', { status: 410 })
  }
}
