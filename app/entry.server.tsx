import type { EntryContext } from "react-router"
import { ServerRouter } from "react-router"
import { renderToReadableStream } from "react-dom/server"
import { isbot } from "isbot"

// Cloudflare Workers/Pages 兼容的服务端渲染入口。
// 与默认的 Node 入口（renderToPipeableStream + node:stream）不同，
// 这里使用 Web 标准的 renderToReadableStream，可在 Workers runtime 运行。
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: unknown,
) {
  const stream = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        console.error(error)
      },
    },
  )

  responseHeaders.set("Content-Type", "text/html")

  // 爬虫请求等待全部内容渲染完成，保证抓取到完整 HTML
  if (isbot(request.headers.get("user-agent"))) {
    await stream.allReady
  }

  return new Response(stream, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
