import { createRequestHandler } from 'react-router'
import type { ServerBuild } from 'react-router'
import * as build from './build/server'
import type { ExecutionContext, KVNamespace } from '@cloudflare/workers-types'

// Cloudflare Workers 环境变量绑定
// 正式环境的 GITHUB_TOKEN 请在 Cloudflare 面板 Settings → Variables 中配置为 Secret；
// 本地调试用 .dev.vars（见 .dev.vars.example）
interface Env {
  // Optional overrides. Both are read from the load context by the routes:
  // GITHUB_LOGIN picks the account the REST reader indexes, SITE_URL pins the
  // canonical origin used by meta tags, the feed and the sitemap.
  GITHUB_LOGIN?: string
  GITHUB_TOKEN?: string
  SITE_URL?: string
  // GitHub 索引的持久化缓存（wrangler.toml 的 kv_namespaces 绑定）
  CACHE?: KVNamespace
}

const requestHandler = createRequestHandler(
  // build/server 是 react-router build 生成的无类型声明 bundle，这里显式断言
  build as unknown as ServerBuild,
  process.env.NODE_ENV
)

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    // 1. 强制 HTTP -> HTTPS 301 重定向
    const proto = request.headers.get('x-forwarded-proto')
    if (url.protocol === 'http:' || proto === 'http') {
      url.protocol = 'https:'
      return Response.redirect(url.toString(), 301)
    }

    // 2. 边界守卫：Fetch 规范禁止 GET/HEAD 携带 body。
    // PowerShell Invoke-WebRequest、.NET HttpClient 及部分可用性监控默认带有 Content-Length: 0，
    // React Router 构造 Request 时会抛 TypeError 触发 500。在此净化入参。
    let cleanRequest = request
    const isGetOrHead = request.method === 'GET' || request.method === 'HEAD'
    if (
      isGetOrHead &&
      (request.body || request.headers.has('content-length'))
    ) {
      const headers = new Headers(request.headers)
      headers.delete('content-length')
      headers.delete('content-type')
      cleanRequest = new Request(request.url, {
        method: request.method,
        headers,
        redirect: request.redirect,
      })
    }

    // 3. 把 Cloudflare 的 env / ctx 注入 React Router 的 loadContext
    const response = await requestHandler(cleanRequest, {
      cloudflare: { env, ctx },
    })

    // 4. 补齐生产安全标头与 HSTS
    const headers = new Headers(response.headers)
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('X-Frame-Options', 'SAMEORIGIN')
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
}
