'use strict'

// 腾讯云 SCF Web 函数（Node.js 20）：浏览器只提交 q/from/to，密钥与签名留在服务端。
const http = require('http')
const crypto = require('crypto')

const MAX_TEXT_BYTES = 6000
const MAX_BODY_BYTES = 18000
const RATE_WINDOW_MS = 60_000
const RATE_MAX_REQUESTS = 20
const visits = new Map()

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || 'https://jsoncc.github.io,http://localhost:3000')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function corsHeaders(req) {
  const origin = req.headers.origin
  if (!origin || !allowedOrigins().includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  }
}

function sendJson(res, req, status, body) {
  res.writeHead(status, {
    ...corsHeaders(req),
    'Content-Type': 'application/json; charset=utf-8'
  })
  res.end(JSON.stringify(body))
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim()
}

function isRateLimited(req) {
  const now = Date.now()
  const ip = clientIp(req)
  const current = visits.get(ip)
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    visits.set(ip, { startedAt: now, count: 1 })
    return false
  }
  current.count += 1
  return current.count > RATE_MAX_REQUESTS
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const parts = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        reject(new Error('request_too_large'))
        req.destroy()
        return
      }
      parts.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(parts).toString('utf8')))
    req.on('error', reject)
  })
}

async function translate(q, from, to) {
  const appid = process.env.BAIDU_APP_ID
  const secret = process.env.BAIDU_SECRET
  if (!appid || !secret) throw new Error('server_not_configured')

  const salt = crypto.randomUUID()
  const sign = crypto.createHash('md5').update(`${appid}${q}${salt}${secret}`).digest('hex')
  const body = new URLSearchParams({ q, from, to, appid, salt, sign })
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    const upstream = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body,
      signal: controller.signal
    })
    return { status: upstream.status, body: await upstream.json() }
  } finally {
    clearTimeout(timeout)
  }
}

http.createServer(async (req, res) => {
  const origin = req.headers.origin
  if (origin && !allowedOrigins().includes(origin)) {
    sendJson(res, req, 403, { error: 'origin_not_allowed' })
    return
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req))
    res.end()
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, req, 405, { error: 'method_not_allowed' })
    return
  }
  if (isRateLimited(req)) {
    sendJson(res, req, 429, { error: 'rate_limited', message: '请求过于频繁，请稍后再试' })
    return
  }

  try {
    const params = new URLSearchParams(await readBody(req))
    const q = (params.get('q') || '').trim()
    const from = params.get('from') || 'auto'
    const to = params.get('to') || ''
    if (!q || Buffer.byteLength(q, 'utf8') > MAX_TEXT_BYTES) {
      sendJson(res, req, 400, { error: 'invalid_text', message: `文本不能为空且不得超过 ${MAX_TEXT_BYTES} UTF-8 字节` })
      return
    }
    if (!['auto', 'zh', 'en'].includes(from) || !['zh', 'en'].includes(to)) {
      sendJson(res, req, 400, { error: 'invalid_language' })
      return
    }

    const upstream = await translate(q, from, to)
    sendJson(res, req, upstream.status, upstream.body)
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    const message = error instanceof Error ? error.message : 'translation_failed'
    const status = message === 'request_too_large' ? 413 : message === 'server_not_configured' ? 503 : 502
    sendJson(res, req, status, { error: isTimeout ? 'upstream_timeout' : message })
  }
}).listen(9000, () => console.log('Secure Baidu translation proxy listening on 9000'))
