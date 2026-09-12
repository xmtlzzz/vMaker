export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'vmaker-theme'
export const ACCENT_STORAGE_KEY = 'vmaker-accent'
export const LOCALE_STORAGE_KEY = 'vmaker-locale'

// The production origin. It is only a *default*: canonical URLs, og:url, the RSS
// feed and the sitemap are derived per request from the host the request arrived on
// (see `resolveSiteUrl`), so a preview deploy labels itself with its own address
// instead of claiming to be production. Pin the public origin by setting SITE_URL.
export const SITE_URL = 'https://vmaker.xmtlz.dev'

// The repository whose GitHub social card doubles as the homepage og:image.
export const SITE_REPO = 'vMaker'

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

// Origin resolution order: an explicit SITE_URL (the pinned production address), the
// preview host the request actually arrived on, then the built-in default. Falling
// back to the request origin is what lets a Cloudflare preview or a custom domain
// serve correct absolute URLs with no code change.
export function resolveSiteUrl(
  options: {
    configured?: string | null
    request?: Request
  } = {}
) {
  const configured = options.configured?.trim()

  if (configured) {
    return stripTrailingSlash(configured)
  }

  if (options.request) {
    try {
      return new URL(options.request.url).origin
    } catch {
      // a malformed request URL should degrade, not 500 the page
    }
  }

  return SITE_URL
}
