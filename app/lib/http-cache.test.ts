import assert from 'node:assert/strict'

import {
  cacheHeaders,
  etagMatches,
  respondWithEtag,
  weakEtag,
} from '~/lib/http-cache'

async function testWeakEtagIsStableAndQuoted() {
  const etag = weakEtag('hello world')

  assert.equal(weakEtag('hello world'), etag, 'identical input is stable')
  assert.match(etag, /^"[0-9a-f]{1,8}"$/, 'quoted lowercase hex')
  assert.notEqual(weakEtag('hello world!'), etag, 'changed body changes tag')
  assert.match(weakEtag(''), /^"[0-9a-f]{1,8}"$/, 'empty body is still quoted')

  // UTF-8 bytes, not code units: these must not collide
  assert.notEqual(weakEtag('\u00e9'), weakEtag('e'))
}

async function testEtagMatches() {
  const etag = weakEtag('body')

  assert.equal(etagMatches(etag, etag), true, 'exact match')
  assert.equal(etagMatches(`W/${etag}`, etag), true, 'weak request prefix')
  assert.equal(etagMatches(etag, `W/${etag}`), true, 'weak stored prefix')
  assert.equal(etagMatches('*', etag), true, 'wildcard')
  assert.equal(etagMatches(`"other", ${etag}`, etag), true, 'comma list')
  assert.equal(etagMatches(`"other" , ${etag} ,"third"`, etag), true, 'spaced')
  assert.equal(etagMatches(`"other"`, etag), false, 'no match')
  assert.equal(etagMatches(null, etag), false, 'missing header')
  assert.equal(etagMatches('', etag), false, 'empty header')
}

async function testRespondWithEtag304() {
  const body = '<html>cached</html>'
  const etag = weakEtag(body)
  const request = new Request('https://example.com/', {
    headers: { 'If-None-Match': etag },
  })

  const response = respondWithEtag(request, body, {
    contentType: 'text/html; charset=utf-8',
  })

  assert.equal(response.status, 304)
  assert.equal(await response.text(), '', '304 carries no body')
  assert.equal(response.headers.get('ETag'), etag, '304 keeps the ETag')
  assert.equal(
    response.headers.get('Cache-Control'),
    'public, max-age=600, stale-while-revalidate=300'
  )
}

async function testRespondWithEtag200() {
  const body = '{"ok":true}'
  const response = respondWithEtag(
    new Request('https://example.com/api'),
    body,
    { contentType: 'application/json', maxAge: 60, staleWhileRevalidate: 10 }
  )

  assert.equal(response.status, 200)
  assert.equal(await response.text(), body)
  assert.equal(response.headers.get('Content-Type'), 'application/json')
  assert.equal(response.headers.get('ETag'), weakEtag(body))
  assert.equal(
    response.headers.get('Cache-Control'),
    'public, max-age=60, stale-while-revalidate=10'
  )
}

async function testRespondWithEtagIgnoresStaleRequest() {
  const body = 'x'
  const response = respondWithEtag(
    new Request('https://example.com/', {
      headers: { 'If-None-Match': '"0"' },
    }),
    body,
    { contentType: 'text/plain' }
  )

  assert.equal(response.status, 200)
  assert.equal(await response.text(), body)
}

async function testCacheHeaders() {
  assert.deepEqual(cacheHeaders(), {
    'Cache-Control': 'public, max-age=600, stale-while-revalidate=300',
  })
  assert.equal(
    cacheHeaders({ maxAge: 0 })['Cache-Control'],
    'public, max-age=0, stale-while-revalidate=300',
    'zero max-age is allowed'
  )
  assert.equal(
    cacheHeaders({ maxAge: -30 })['Cache-Control'],
    'public, max-age=0, stale-while-revalidate=300',
    'negative max-age clamps to 0'
  )
  assert.equal(
    cacheHeaders({ maxAge: 86400, staleWhileRevalidate: 3600 })[
      'Cache-Control'
    ],
    'public, max-age=86400, stale-while-revalidate=3600'
  )
}

async function testCacheHeadersOmitStaleWhileRevalidate() {
  assert.equal(
    cacheHeaders({ staleWhileRevalidate: 0 })['Cache-Control'],
    'public, max-age=600',
    'explicit 0 omits the directive'
  )

  const response = respondWithEtag(
    new Request('https://example.com/'),
    'body',
    { contentType: 'text/html', staleWhileRevalidate: 0 }
  )
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=600')
  assert.ok(
    !response.headers.get('Cache-Control')?.includes('stale-while-revalidate')
  )
}

await testWeakEtagIsStableAndQuoted()
await testEtagMatches()
await testRespondWithEtag304()
await testRespondWithEtag200()
await testRespondWithEtagIgnoresStaleRequest()
await testCacheHeaders()
await testCacheHeadersOmitStaleWhileRevalidate()

console.log('http-cache passed')
