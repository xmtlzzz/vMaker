const DEFAULT_MAX_AGE = 600
const DEFAULT_STALE_WHILE_REVALIDATE = 300

const FNV_OFFSET_BASIS = 0x811c9dc5
const FNV_PRIME = 0x01000193

// FNV-1a over the UTF-8 bytes, so byte-identical input always yields the same
// tag and any change to the payload (including multibyte edits) flips it.
function fnv1a(bytes: Uint8Array) {
  let hash = FNV_OFFSET_BASIS
  for (const byte of bytes) {
    hash ^= byte
    hash = Math.imul(hash, FNV_PRIME)
  }
  return hash >>> 0
}

export function weakEtag(body: string) {
  const hash = fnv1a(new TextEncoder().encode(body))
  return `"${hash.toString(16).padStart(8, '0')}"`
}

function normalizeEtag(value: string) {
  return value.trim().replace(/^W\//i, '')
}

export function etagMatches(ifNoneMatch: string | null, etag: string) {
  if (!ifNoneMatch) return false

  const header = ifNoneMatch.trim()
  if (header === '*') return true

  const target = normalizeEtag(etag)
  return header
    .split(',')
    .some((candidate) => normalizeEtag(candidate) === target)
}

export function cacheHeaders(
  options: {
    maxAge?: number
    staleWhileRevalidate?: number
  } = {}
) {
  const {
    maxAge = DEFAULT_MAX_AGE,
    staleWhileRevalidate = DEFAULT_STALE_WHILE_REVALIDATE,
  } = options

  const parts = [`public`, `max-age=${maxAge > 0 ? maxAge : 0}`]
  if (staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  }

  return { 'Cache-Control': parts.join(', ') }
}

export function respondWithEtag(
  request: Request,
  body: string,
  options: {
    contentType: string
    maxAge?: number
    staleWhileRevalidate?: number
  }
) {
  const { contentType, maxAge, staleWhileRevalidate } = options
  const etag = weakEtag(body)
  const headers = {
    ...cacheHeaders({ maxAge, staleWhileRevalidate }),
    'Content-Type': contentType,
    ETag: etag,
  }

  if (etagMatches(request.headers.get('If-None-Match'), etag)) {
    return new Response(null, { headers, status: 304 })
  }

  return new Response(body, { headers, status: 200 })
}
