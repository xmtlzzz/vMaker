import type { ProjectsCache, ProjectsCacheStore } from './projects'

type CloudflareContext = {
  cloudflare?: {
    ctx?: { waitUntil: (promise: Promise<unknown>) => void }
    env?: Record<string, unknown>
  }
}

// Cloudflare Workers injects env bindings into the load context; every other
// runtime (local dev, Node, Vercel) lets getProjects fall back to process.env.
export function githubTokenFromContext(context: unknown) {
  const token = (context as CloudflareContext | undefined)?.cloudflare?.env
    ?.GITHUB_TOKEN

  return typeof token === 'string' && token.trim() ? token.trim() : undefined
}

// The site origin is read from the same binding bag so a deployment can pin its
// canonical address as a plain Worker variable; without one, resolveSiteUrl falls
// back to the host each request arrived on.
export function siteUrlFromContext(context: unknown) {
  const bound = (context as CloudflareContext | undefined)?.cloudflare?.env
    ?.SITE_URL
  const fromWorker = typeof bound === 'string' ? bound.trim() : ''

  // Node / Vercel have no binding bag, so mirror the token's resolution and read
  // process.env there instead.
  return fromWorker || process.env.SITE_URL?.trim() || undefined
}

// Assemble the layered-cache options for getProjects from the Workers bindings:
// env.CACHE persists the GitHub index across isolates and ctx.waitUntil keeps a
// background refresh alive after the response is sent. On other runtimes both
// are absent and getProjects degrades to the in-memory cache only.
export function projectsCacheFromContext(context: unknown): ProjectsCache {
  const cloudflare = (context as CloudflareContext | undefined)?.cloudflare
  const store = cloudflare?.env?.CACHE as ProjectsCacheStore | undefined
  const ctx = cloudflare?.ctx

  return {
    ...(store ? { store } : {}),
    ...(ctx
      ? {
          waitUntil: (promise: Promise<unknown>) => {
            ctx.waitUntil(promise)
          },
        }
      : {}),
  }
}
