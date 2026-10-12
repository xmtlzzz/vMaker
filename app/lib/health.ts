// Liveness only: this verifies the Worker entry point, not GitHub, KV or SSR.
// Keep it independent of the router so monitoring never renders the portfolio.
export function healthResponse(request: Request): Response {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  })
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    headers.set('Allow', 'GET, HEAD')
    return new Response(null, { status: 405, headers })
  }
  return new Response(
    request.method === 'HEAD'
      ? null
      : JSON.stringify({ status: 'UP', service: 'vmaker', check: 'liveness' }),
    { headers }
  )
}
