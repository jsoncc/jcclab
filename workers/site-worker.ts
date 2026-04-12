/**
 * Cloudflare Worker 入口：
 * - POST /（或任意路径的 POST，兼容原百度翻译客户端）：转发百度翻译 API
 * - GET /stats：总 PV/UV（KV），CORS + Cookie 访客标记
 *
 * 部署：项目根执行 npx wrangler login 后 npm run workers:deploy
 * Worker 根 URL 写入 VITE_BAIDU_TRANSLATE_URL；统计为同根 + /stats
 */
import { handleStats, type StatsEnv } from './stats'

export interface Env extends StatsEnv {}

const baiduCors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname.replace(/\/$/, '') || '/'

    if (path === '/stats') {
      return handleStats(request, env)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: baiduCors })
    }
    if (request.method !== 'POST') {
      return new Response('POST only', { status: 405, headers: baiduCors })
    }

    const body = await request.text()
    const res = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body
    })
    const text = await res.text()
    return new Response(text, {
      status: res.status,
      headers: {
        ...baiduCors,
        'Content-Type': res.headers.get('content-type') || 'application/json; charset=utf-8'
      }
    })
  }
}
