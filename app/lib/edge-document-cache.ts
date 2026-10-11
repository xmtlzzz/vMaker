import { etagMatches } from './http-cache'

interface DocumentOptions {
  version: string
  identity: string
  cache: Pick<Cache, 'match' | 'put'>
  waitUntil: (task: Promise<unknown>) => void
  render: (request: Request) => Promise<Response>
}
const BROWSER_CACHE = 'public, max-age=0, must-revalidate'
const EDGE_TTL_SECONDS = 300

// Cache only the complete public homepage, keyed by deployment and public config.
// Cache.put consumes the cloned stream; an interrupted SSR stream cannot be stored.
export async function serveDocument(
  request: Request,
  options: DocumentOptions
): Promise<Response> {
  const url = new URL(request.url)
  if (
    !['GET', 'HEAD'].includes(request.method) ||
    url.pathname !== '/' ||
    url.search ||
    ['authorization', 'cookie', 'range'].some((name) =>
      request.headers.has(name)
    ) ||
    /no-cache|no-store/i.test(request.headers.get('Cache-Control') ?? '')
  ) {
    return options.render(request)
  }
  const keyUrl = new URL(url)
  keyUrl.searchParams.set(
    '__vmaker_document',
    JSON.stringify([options.version, options.identity])
  )
  const key = new Request(keyUrl, { method: 'GET' })
  try {
    const cached = await options.cache.match(key)
    if (cached) {
      const headers = new Headers(cached.headers)
      headers.set('Cache-Control', BROWSER_CACHE)
      headers.set('X-vMaker-Cache', 'HIT')
      if (
        etagMatches(
          request.headers.get('If-None-Match'),
          headers.get('ETag') ?? ''
        )
      ) {
        void cached.body?.cancel().catch(() => {})
        return new Response(null, { status: 304, headers })
      }
      if (request.method === 'HEAD') void cached.body?.cancel().catch(() => {})
      return new Response(request.method === 'HEAD' ? null : cached.body, {
        status: cached.status,
        headers,
      })
    }
  } catch (error) {
    console.warn('Homepage cache read failed', error)
  }
  const response = await options.render(request)
  const headers = new Headers(response.headers)
  headers.set('X-vMaker-Cache', 'MISS')
  const result = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
  if (
    request.method === 'GET' &&
    response.status === 200 &&
    /text\/html/i.test(headers.get('Content-Type') ?? '') &&
    !headers.has('Set-Cookie') &&
    !/no-store|no-cache|private/i.test(headers.get('Cache-Control') ?? '') &&
    !(headers.get('Vary') ?? '')
      .split(',')
      .some(
        (value) =>
          value.trim() && value.trim().toLowerCase() !== 'accept-encoding'
      )
  ) {
    const copy = result.clone()
    copy.headers.set('Cache-Control', `public, max-age=${EDGE_TTL_SECONDS}`)
    options.waitUntil(
      options.cache.put(key, copy).catch((error) => {
        console.warn('Homepage cache write failed', error)
      })
    )
  }
  return result
}
