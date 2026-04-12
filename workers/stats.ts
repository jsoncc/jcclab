/**
 * GET /stats：总访问量（PV）每次 +1；总访客（UV）在无 HttpOnly 访客 Cookie 时 +1 并种下 Cookie。
 * 需 CORS 带 credentials，故 Access-Control-Allow-Origin 不能为 *，须与请求 Origin 白名单匹配。
 */

/** 与 Cloudflare KV 子集一致（仅用于本地 vue-tsc；运行时由平台注入） */
interface SiteKV {
  get(key: string): Promise<string | null>
  put(key: string, value: string): Promise<void>
}

const KV_PV = 'total_pv'
const KV_UV = 'total_uv'
const COOKIE_NAME = 'jsoncc_stats_visitor'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 年

const DEFAULT_ORIGINS = [
  'https://jsoncc.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://[::1]:3000',
  'http://localhost:5173'
]

export interface StatsEnv {
  SITE_STATS?: SiteKV
  /** 逗号分隔，追加到默认白名单（如自定义 GitHub Pages 域名） */
  STATS_ORIGINS?: string
}

function parseAllowedOrigins(env: StatsEnv): string[] {
  const extra = (env.STATS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set([...DEFAULT_ORIGINS, ...extra])]
}

function pickAllowOrigin(request: Request, env: StatsEnv): string | null {
  const allowed = parseAllowedOrigins(env)
  const origin = request.headers.get('Origin')
  if (origin && allowed.includes(origin)) return origin
  /**
   * 地址栏直接打开 /site-stats、经 Vite 代理时，部分浏览器对同源 GET 不带 Origin，
   * 可用 Referer 推断站点来源（仅白名单内的 http(s) 主机）。
   */
  const referer = request.headers.get('Referer')
  if (referer) {
    try {
      const u = new URL(referer)
      const pseudo = `${u.protocol}//${u.host}`
      if (allowed.includes(pseudo)) return pseudo
    } catch {
      /* ignore */
    }
  }
  return null
}

function hasVisitorCookie(request: Request): boolean {
  const raw = request.headers.get('Cookie') || ''
  return new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=1(?:;|$)`).test(raw)
}

function jsonResponse(
  body: Record<string, unknown>,
  init: { status?: number; headers?: Record<string, string> } = {}
): Response {
  const { status = 200, headers = {} } = init
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  })
}

export async function handleStats(request: Request, env: StatsEnv): Promise<Response> {
  try {
    return await handleStatsInner(request, env)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: 'internal', message }, { status: 500 })
  }
}

/** OPTIONS 预检 → GET 校验 Origin → 读改 KV → 必要时 Set-Cookie（UV） */
async function handleStatsInner(request: Request, env: StatsEnv): Promise<Response> {
  const allowOrigin = pickAllowOrigin(request, env)
  const baseCors: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  if (request.method === 'OPTIONS') {
    if (!allowOrigin) {
      return new Response(null, { status: 204, headers: baseCors })
    }
    return new Response(null, {
      status: 204,
      headers: {
        ...baseCors,
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!allowOrigin) {
    return jsonResponse(
      { error: 'origin_not_allowed', totalPv: 0, totalUv: 0, configured: false },
      {
        status: 403,
        headers: baseCors
      }
    )
  }

  const corsOk: Record<string, string> = {
    ...baseCors,
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true'
  }

  if (!env.SITE_STATS) {
    return jsonResponse(
      {
        totalPv: 0,
        totalUv: 0,
        configured: false,
        message: 'SITE_STATS KV 未绑定，见 workers/README.md'
      },
      { headers: corsOk }
    )
  }

  const kv = env.SITE_STATS
  const pvRaw = await kv.get(KV_PV)
  const uvRaw = await kv.get(KV_UV)
  let totalPv = Math.max(0, parseInt(pvRaw || '0', 10) || 0)
  let totalUv = Math.max(0, parseInt(uvRaw || '0', 10) || 0)

  totalPv += 1

  const visitor = hasVisitorCookie(request)
  let setCookie: string | undefined
  if (!visitor) {
    totalUv += 1
    /** 本地 http:// 下不能使用 Secure；生产 https 站点需 SameSite=None; Secure 才能跨站带 Cookie */
    const isLocalHttp =
      allowOrigin.startsWith('http://localhost') ||
      allowOrigin.startsWith('http://127.0.0.1') ||
      allowOrigin.startsWith('http://[::1]')
    setCookie = isLocalHttp
      ? `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; SameSite=Lax`
      : `${COOKIE_NAME}=1; Path=/; Max-Age=${COOKIE_MAX_AGE}; Secure; HttpOnly; SameSite=None`
  }

  await kv.put(KV_PV, String(totalPv))
  await kv.put(KV_UV, String(totalUv))

  const headers: Record<string, string> = { ...corsOk }
  if (setCookie) headers['Set-Cookie'] = setCookie

  return jsonResponse({ totalPv, totalUv, configured: true }, { headers })
}
