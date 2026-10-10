import type { EntryContext } from 'react-router'
import { ServerRouter } from 'react-router'
import { renderToReadableStream } from 'react-dom/server'
import { isbot } from 'isbot'

// Cloudflare Workers/Pages 兼容的服务端渲染入口。
// 与默认的 Node 入口（renderToPipeableStream + node:stream）不同，
// 这里使用 Web 标准的 renderToReadableStream，可在 Workers runtime 运行。
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: unknown
) {
  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        console.error(error)
      },
    }
  )

  responseHeaders.set('Content-Type', 'text/html')
  responseHeaders.set('X-Content-Type-Options', 'nosniff')
  responseHeaders.set('X-Frame-Options', 'SAMEORIGIN')
  responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // 恢复路由 loader 返回的 ETag 与 Cache-Control（避免根路由空 headers() 覆写导致 ETag 丢失）
  if (
    !responseHeaders.has('ETag') &&
    routerContext.staticHandlerContext?.matches
  ) {
    for (const match of routerContext.staticHandlerContext.matches) {
      const routeHeaders =
        routerContext.staticHandlerContext.loaderHeaders[match.route.id]
      if (routeHeaders?.has('ETag')) {
        responseHeaders.set('ETag', routeHeaders.get('ETag')!)
        if (routeHeaders.has('Cache-Control')) {
          responseHeaders.set(
            'Cache-Control',
            routeHeaders.get('Cache-Control')!
          )
        }
        break
      }
    }
  }

  // 爬虫请求等待全部内容渲染完成，保证抓取到完整 HTML
  if (isbot(request.headers.get('user-agent'))) {
    await stream.allReady
  }

  return new Response(stream, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
