import assert from 'node:assert/strict'
import { serveDocument } from './edge-document-cache'

const entries = new Map<string, Response>()
const pending: Promise<unknown>[] = []
let renders = 0
const options = {
  version: 'build-1',
  identity: 'owner|origin',
  cache: {
    async match(key: Request) {
      return entries.get(key.url)?.clone()
    },
    async put(key: Request, response: Response) {
      // Like Cache API, a broken stream must never become a cached document.
      const body = await response.arrayBuffer()
      entries.set(key.url, new Response(body, response))
    },
  },
  waitUntil(task: Promise<unknown>) {
    pending.push(task)
  },
  async render(_request: Request) {
    renders++
    return new Response('<html>complete</html>', {
      headers: {
        'Content-Type': 'text/html',
        ETag: 'W/"one"',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    })
  },
}
const request = new Request('https://vmaker.example/')
const first = await serveDocument(request, options)
assert.equal(await first.text(), '<html>complete</html>')
await Promise.all(pending.splice(0))
const hit = await serveDocument(request, options)
assert.equal(await hit.text(), '<html>complete</html>')
assert.equal(renders, 1, 'cached homepage avoids SSR')
assert.equal(hit.headers.get('X-vMaker-Cache'), 'HIT')
assert.equal(
  hit.headers.get('Cache-Control'),
  'public, max-age=0, must-revalidate'
)
const conditional = await serveDocument(
  new Request(request, { headers: { 'If-None-Match': 'W/"one"' } }),
  options
)
assert.equal(conditional.status, 304)
assert.equal(await conditional.text(), '')
assert.equal(
  (await serveDocument(new Request(request, { method: 'HEAD' }), options)).body,
  null
)
for (const bypass of [
  new Request('https://vmaker.example/?query=1'),
  new Request(request, { headers: { Cookie: 'session=private' } }),
  new Request(request, { headers: { Authorization: 'Bearer test' } }),
])
  await serveDocument(bypass, options)
assert.equal(renders, 4, 'private and query requests bypass public cache')
await serveDocument(request, { ...options, version: 'build-2' })
assert.equal(renders, 5, 'deploy version invalidates cached markup')
await serveDocument(request, { ...options, identity: 'other-owner' })
assert.equal(renders, 6, 'owner configuration isolates cache')
await Promise.all(pending.splice(0))
for (const headers of [
  { 'Cache-Control': 'no-store' },
  { 'Set-Cookie': 'private=1' },
  { Vary: 'Cookie' },
] as Record<string, string>[]) {
  entries.clear()
  await serveDocument(request, {
    ...options,
    render: async () =>
      new Response('private', {
        headers: { 'Content-Type': 'text/html', ...headers },
      }),
  })
  await Promise.all(pending.splice(0))
  assert.equal(entries.size, 0)
}
entries.clear()
await serveDocument(new Request(request, { method: 'HEAD' }), options)
await Promise.all(pending.splice(0))
assert.equal(
  entries.size,
  0,
  'HEAD miss must not poison GET with an empty response'
)
const broken = () =>
  new Response(
    new ReadableStream({
      start(controller) {
        controller.error(new Error('SSR failed'))
      },
    }),
    { headers: { 'Content-Type': 'text/html' } }
  )
await serveDocument(request, { ...options, render: async () => broken() })
await Promise.all(pending.splice(0))
assert.equal(entries.size, 0, 'broken SSR cannot populate cache')
const failedCache = {
  async match() {
    throw new Error('cache unavailable')
  },
  async put() {
    throw new Error('cache unavailable')
  },
}
assert.equal(
  (await serveDocument(request, { ...options, cache: failedCache })).status,
  200
)
await Promise.all(pending.splice(0))
console.log('edge document cache tests passed')
